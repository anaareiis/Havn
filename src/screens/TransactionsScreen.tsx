import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Modal, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Input } from '../components';
import {
  type Account,
  type Category,
  type Transaction,
  createTransaction,
  findAllAccounts,
  findAllCategories,
  findAllTransactions,
  removeTransaction,
  updateTransaction,
} from '../lib/db';
import { formatCurrency } from '../lib/format';
import { useTheme } from '../theme';

interface FormErrors {
  amount?: string;
  account?: string;
  category?: string;
  date?: string;
}

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForInput(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function parseDateInput(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  return isValid ? `${year}-${month}-${day}` : null;
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [dateText, setDateText] = useState(formatDateForInput(todayIso()));
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const loadData = useCallback(async () => {
    const [transactionList, accountList, categoryList] = await Promise.all([
      findAllTransactions(),
      findAllAccounts(),
      findAllCategories(),
    ]);
    setTransactions(transactionList);
    setAccounts(accountList);
    setCategories(categoryList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  function accountName(id: string): string {
    return accounts.find((account) => account.id === id)?.name ?? 'Conta removida';
  }

  function findCategory(id: string | null): Category | undefined {
    return categories.find((category) => category.id === id);
  }

  function openCreateModal() {
    setEditingTransaction(null);
    setAmountText('');
    setDescription('');
    setDateText(formatDateForInput(todayIso()));
    setAccountId(accounts[0]?.id ?? null);
    setCategoryId(categories[0]?.id ?? null);
    setErrors({});
    setModalVisible(true);
  }

  function openEditModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setAmountText(String(transaction.amount));
    setDescription(transaction.description ?? '');
    setDateText(formatDateForInput(transaction.date));
    setAccountId(transaction.accountId);
    setCategoryId(transaction.categoryId);
    setErrors({});
    setModalVisible(true);
  }

  async function handleSave() {
    const newErrors: FormErrors = {};
    const parsedAmount = Number(amountText.replace(',', '.'));
    if (!amountText.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Informe um valor válido maior que zero';
    }
    if (!accountId) {
      newErrors.account = 'Selecione uma conta';
    }
    if (!categoryId) {
      newErrors.category = 'Selecione uma categoria';
    }
    const isoDate = parseDateInput(dateText);
    if (!isoDate) {
      newErrors.date = 'Data inválida (dd/mm/aaaa)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !accountId || !categoryId || !isoDate) return;

    const category = findCategory(categoryId);
    if (!category) return;

    const input = {
      accountId,
      categoryId,
      amount: parsedAmount,
      type: category.type,
      description: description.trim() || null,
      date: isoDate,
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, input);
    } else {
      await createTransaction(input);
    }

    setModalVisible(false);
    await loadData();
  }

  function handleDelete(transaction: Transaction) {
    Alert.alert('Excluir transação', 'Deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removeTransaction(transaction.id);
          await loadData();
        },
      },
    ]);
  }

  const hasAccounts = accounts.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListHeaderComponent={
          <Button
            label="Nova transação"
            variant="primary"
            disabled={!hasAccounts}
            onPress={openCreateModal}
          />
        }
        ListHeaderComponentStyle={{ marginBottom: theme.spacing.md }}
        ListEmptyComponent={
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.rounded.regular,
              fontSize: theme.fontSize.sm,
              textAlign: 'center',
            }}
          >
            {hasAccounts
              ? 'Nenhuma transação cadastrada.'
              : 'Cadastre uma conta antes de criar transações.'}
          </Text>
        }
        renderItem={({ item }) => {
          const category = findCategory(item.categoryId);
          const isIncome = item.type === 'income';

          return (
            <Card style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.rounded.semibold,
                    fontSize: theme.fontSize.md,
                  }}
                >
                  {item.description || category?.name || 'Transação'}
                </Text>
                <Text
                  style={{
                    color: isIncome ? theme.colors.success : theme.colors.danger,
                    fontFamily: theme.fontFamily.tabular.bold,
                    fontSize: theme.fontSize.md,
                  }}
                >
                  {isIncome ? '+ ' : '- '}
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                {category ? (
                  <Badge
                    label={`${category.icon ?? ''} ${category.name}`.trim()}
                    variant="neutral"
                  />
                ) : null}
                <Badge label={accountName(item.accountId)} variant="accent" />
                <Badge label={formatDateForInput(item.date)} variant="neutral" />
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Button label="Editar" variant="outline" onPress={() => openEditModal(item)} />
                <Button label="Excluir" variant="outline" onPress={() => handleDelete(item)} />
              </View>
            </Card>
          );
        }}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={{ gap: theme.spacing.md }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.fontFamily.rounded.bold,
                fontSize: theme.fontSize.lg,
              }}
            >
              {editingTransaction ? 'Editar transação' : 'Nova transação'}
            </Text>

            <Input
              label="Valor"
              placeholder="0,00"
              keyboardType="numeric"
              value={amountText}
              onChangeText={setAmountText}
              error={errors.amount}
            />

            <Input
              label="Descrição"
              placeholder="Ex: Mercado"
              value={description}
              onChangeText={setDescription}
            />

            <Input
              label="Data"
              placeholder="dd/mm/aaaa"
              value={dateText}
              onChangeText={setDateText}
              error={errors.date}
            />

            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Conta
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {accounts.map((account) => (
                  <Button
                    key={account.id}
                    label={account.name}
                    variant={accountId === account.id ? 'primary' : 'outline'}
                    onPress={() => setAccountId(account.id)}
                  />
                ))}
              </View>
              {errors.account ? (
                <Text style={{ color: theme.colors.danger, fontSize: theme.fontSize.xs }}>
                  {errors.account}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Categoria
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    label={`${category.icon ?? ''} ${category.name}`.trim()}
                    variant={categoryId === category.id ? 'primary' : 'outline'}
                    onPress={() => setCategoryId(category.id)}
                  />
                ))}
              </View>
              {errors.category ? (
                <Text style={{ color: theme.colors.danger, fontSize: theme.fontSize.xs }}>
                  {errors.category}
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button label="Cancelar" variant="outline" onPress={() => setModalVisible(false)} />
              <Button label="Salvar" variant="primary" onPress={handleSave} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
