import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, Text, View } from 'react-native';

import { Badge, Card } from '../components';
import {
  type Category,
  findAllCategories,
  getExpensesByCategory,
  getTotalsByPeriod,
} from '../lib/db';
import { monthLabel, monthRange, previousMonth } from '../lib/date';
import { formatCurrency } from '../lib/format';
import { useTheme } from '../theme';

interface CategoryExpense {
  category: Category;
  total: number;
}

export default function HomeScreen() {
  const theme = useTheme();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [previousTotalExpense, setPreviousTotalExpense] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryExpense[]>([]);

  const [now] = useState(() => new Date());
  const current = monthRange(now);
  const previous = monthRange(previousMonth(now));

  const loadDashboard = useCallback(async () => {
    const [categories, totals, previousTotals, categoryTotals] = await Promise.all([
      findAllCategories(),
      getTotalsByPeriod(current.start, current.end),
      getTotalsByPeriod(previous.start, previous.end),
      getExpensesByCategory(current.start, current.end),
    ]);

    setTotalIncome(totals.totalIncome);
    setTotalExpense(totals.totalExpense);
    setPreviousTotalExpense(previousTotals.totalExpense);

    setExpensesByCategory(
      categoryTotals
        .map((entry) => {
          const category = categories.find((item) => item.id === entry.categoryId);
          return category ? { category, total: entry.total } : null;
        })
        .filter((entry): entry is CategoryExpense => entry !== null),
    );
  }, [current.start, current.end, previous.start, previous.end]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const balance = totalIncome - totalExpense;
  const expenseDelta = totalExpense - previousTotalExpense;
  const expenseDeltaPercent =
    previousTotalExpense > 0 ? (expenseDelta / previousTotalExpense) * 100 : null;
  const maxCategoryTotal = expensesByCategory.reduce((max, entry) => Math.max(max, entry.total), 0);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamily.rounded.extrabold,
          fontSize: theme.fontSize.xxl,
        }}
      >
        Havn
      </Text>

      <Card style={{ gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.sm,
          }}
        >
          {monthLabel(now)}
        </Text>
        <Text
          style={{
            color: balance >= 0 ? theme.colors.textPrimary : theme.colors.danger,
            fontFamily: theme.fontFamily.tabular.bold,
            fontSize: theme.fontSize.xxl,
          }}
        >
          {formatCurrency(balance)}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Badge label={`Receitas ${formatCurrency(totalIncome)}`} variant="success" />
          <Badge label={`Despesas ${formatCurrency(totalExpense)}`} variant="danger" />
        </View>
      </Card>

      <Card style={{ gap: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.md,
          }}
        >
          Comparação com o mês anterior
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          {previousTotalExpense === 0
            ? 'Sem dados de despesas no mês anterior.'
            : `Despesas ${expenseDelta >= 0 ? 'subiram' : 'caíram'} ${Math.abs(
                expenseDeltaPercent ?? 0,
              ).toFixed(0)}% (${formatCurrency(Math.abs(expenseDelta))})`}
        </Text>
      </Card>

      <Card style={{ gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.md,
          }}
        >
          Gastos por categoria
        </Text>

        {expensesByCategory.length === 0 ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.rounded.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            Nenhuma despesa registrada neste mês.
          </Text>
        ) : (
          expensesByCategory.map(({ category, total }) => (
            <View key={category.id} style={{ gap: theme.spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.rounded.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {`${category.icon ?? ''} ${category.name}`.trim()}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.tabular.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {formatCurrency(total)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.surfaceAlt,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${maxCategoryTotal > 0 ? (total / maxCategoryTotal) * 100 : 0}%`,
                    borderRadius: theme.radius.full,
                    backgroundColor: category.color ?? theme.colors.primary,
                  }}
                />
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
