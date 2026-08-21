import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Modal, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Input } from '../components';
import {
  type Account,
  type Anchor,
  type AnchorFrequency,
  type Category,
  createAnchor,
  findAllAccounts,
  findAllAnchors,
  findAllCategories,
  monthlyEquivalent,
  removeAnchor,
  updateAnchor,
} from '../lib/db';
import { formatDateForInput, parseDateInput, todayIso } from '../lib/date';
import { formatCurrency } from '../lib/format';
import { useTheme } from '../theme';

interface FormErrors {
  name?: string;
  amount?: string;
  category?: string;
  account?: string;
  nextDueDate?: string;
}

const FREQUENCIES: { value: AnchorFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

function frequencyLabel(frequency: AnchorFrequency): string {
  return FREQUENCIES.find((option) => option.value === frequency)?.label ?? frequency;
}

export default function AnchorsScreen() {
  const theme = useTheme();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnchor, setEditingAnchor] = useState<Anchor | null>(null);
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<AnchorFrequency>('monthly');
  const [nextDueDateText, setNextDueDateText] = useState(formatDateForInput(todayIso()));
  const [errors, setErrors] = useState<FormErrors>({});

  const loadData = useCallback(async () => {
    const [anchorList, accountList, categoryList] = await Promise.all([
      findAllAnchors(),
      findAllAccounts(),
      findAllCategories(),
    ]);
    setAnchors(anchorList);
    setAccounts(accountList);
    setCategories(categoryList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  function findCategory(id: string | null): Category | undefined {
    return categories.find((category) => category.id === id);
  }

  function accountName(id: string): string {
    return accounts.find((account) => account.id === id)?.name ?? 'Conta removida';
  }

  function openCreateModal() {
    setEditingAnchor(null);
    setName('');
    setAmountText('');
    setCategoryId(categories[0]?.id ?? null);
    setAccountId(accounts[0]?.id ?? null);
    setFrequency('monthly');
    setNextDueDateText(formatDateForInput(todayIso()));
    setErrors({});
    setModalVisible(true);
  }

  function openEditModal(anchor: Anchor) {
    setEditingAnchor(anchor);
    setName(anchor.name);
    setAmountText(String(anchor.amount));
    setCategoryId(anchor.categoryId);
    setAccountId(anchor.accountId);
    setFrequency(anchor.frequency);
    setNextDueDateText(formatDateForInput(anchor.nextDueDate));
    setErrors({});
    setModalVisible(true);
  }

  async function handleSave() {
    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Informe um nome';
    }
    const parsedAmount = Number(amountText.replace(',', '.'));
    if (!amountText.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Informe um valor válido maior que zero';
    }
    if (!categoryId) {
      newErrors.category = 'Selecione uma categoria';
    }
    if (!accountId) {
      newErrors.account = 'Selecione uma conta';
    }
    const isoNextDueDate = parseDateInput(nextDueDateText);
    if (!isoNextDueDate) {
      newErrors.nextDueDate = 'Data inválida (dd/mm/aaaa)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !categoryId || !accountId || !isoNextDueDate) return;

    const category = findCategory(categoryId);
    if (!category) return;

    const input = {
      name: name.trim(),
      amount: parsedAmount,
      type: category.type,
      categoryId,
      accountId,
      frequency,
      nextDueDate: isoNextDueDate,
    };

    if (editingAnchor) {
      await updateAnchor(editingAnchor.id, input);
    } else {
      await createAnchor(input);
    }

    setModalVisible(false);
    await loadData();
  }

  function handleDelete(anchor: Anchor) {
    Alert.alert('Excluir âncora', `Deseja excluir "${anchor.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removeAnchor(anchor.id);
          await loadData();
        },
      },
    ]);
  }

  const canCreate = accounts.length > 0 && categories.length > 0;
  const monthlyCommittedTotal = anchors
    .filter((anchor) => anchor.active)
    .reduce((total, anchor) => total + monthlyEquivalent(anchor.amount, anchor.frequency), 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={anchors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md }}>
            <Card style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Total mensal em Âncoras ativas
              </Text>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.tabular.bold,
                  fontSize: theme.fontSize.xl,
                }}
              >
                {formatCurrency(monthlyCommittedTotal)}
              </Text>
            </Card>

            <Button
              label="Nova âncora"
              variant="primary"
              disabled={!canCreate}
              onPress={openCreateModal}
            />
          </View>
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
            {canCreate
              ? 'Nenhuma âncora cadastrada.'
              : 'Cadastre uma conta e uma categoria antes de criar âncoras.'}
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
                  {item.name}
                </Text>
                <Text
                  style={{
                    color: isIncome ? theme.colors.success : theme.colors.danger,
                    fontFamily: theme.fontFamily.tabular.bold,
                    fontSize: theme.fontSize.md,
                  }}
                >
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                <Badge label={frequencyLabel(item.frequency)} variant="accent" />
                {category ? (
                  <Badge
                    label={`${category.icon ?? ''} ${category.name}`.trim()}
                    variant="neutral"
                  />
                ) : null}
                <Badge label={accountName(item.accountId)} variant="neutral" />
                <Badge
                  label={`Próximo: ${formatDateForInput(item.nextDueDate)}`}
                  variant="neutral"
                />
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
              {editingAnchor ? 'Editar âncora' : 'Nova âncora'}
            </Text>

            <Input
              label="Nome"
              placeholder="Ex: Netflix"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <Input
              label="Valor"
              placeholder="0,00"
              keyboardType="numeric"
              value={amountText}
              onChangeText={setAmountText}
              error={errors.amount}
            />

            <Input
              label="Próximo vencimento"
              placeholder="dd/mm/aaaa"
              value={nextDueDateText}
              onChangeText={setNextDueDateText}
              error={errors.nextDueDate}
            />

            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Frequência
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                {FREQUENCIES.map((option) => (
                  <Button
                    key={option.value}
                    label={option.label}
                    variant={frequency === option.value ? 'primary' : 'outline'}
                    onPress={() => setFrequency(option.value)}
                  />
                ))}
              </View>
            </View>

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
