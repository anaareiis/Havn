import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Input } from '../components';
import {
  type Category,
  type CategoryType,
  createCategory,
  findAllCategories,
  removeCategory,
  updateCategory,
} from '../lib/db';
import { useTheme } from '../theme';

const CATEGORY_COLORS = [
  '#D14343',
  '#0F4C81',
  '#C79A45',
  '#8A6A22',
  '#2E9E6C',
  '#4A9FDE',
  '#5B6B7C',
  '#1F7A54',
];

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
];

export default function CategoriesScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [type, setType] = useState<CategoryType>('expense');

  const loadCategories = useCallback(async () => {
    setCategories(await findAllCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  function openCreateModal() {
    setEditingCategory(null);
    setName('');
    setIcon('');
    setColor(CATEGORY_COLORS[0]);
    setType('expense');
    setModalVisible(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon ?? '');
    setColor(category.color ?? CATEGORY_COLORS[0]);
    setType(category.type);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        icon: icon.trim() || null,
        color,
        type,
      });
    } else {
      await createCategory({ name: name.trim(), icon: icon.trim() || null, color, type });
    }

    setModalVisible(false);
    await loadCategories();
  }

  function handleDelete(category: Category) {
    Alert.alert('Excluir categoria', `Deseja excluir "${category.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removeCategory(category.id);
          await loadCategories();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        ListHeaderComponent={
          <Button label="Nova categoria" variant="primary" onPress={openCreateModal} />
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
            Nenhuma categoria cadastrada.
          </Text>
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: item.color ?? theme.colors.surfaceAlt,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Text style={styles.icon}>{item.icon}</Text>
            </View>

            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.md,
                }}
              >
                {item.name}
              </Text>
              <Badge
                label={item.type === 'income' ? 'Receita' : 'Despesa'}
                variant={item.type === 'income' ? 'success' : 'danger'}
              />
            </View>

            <View style={{ gap: theme.spacing.sm }}>
              <Button label="Editar" variant="outline" onPress={() => openEditModal(item)} />
              <Button label="Excluir" variant="outline" onPress={() => handleDelete(item)} />
            </View>
          </Card>
        )}
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
              {editingCategory ? 'Editar categoria' : 'Nova categoria'}
            </Text>

            <Input label="Nome" placeholder="Ex: Alimentação" value={name} onChangeText={setName} />

            <Input
              label="Ícone (emoji)"
              placeholder="Ex: 🍔"
              value={icon}
              onChangeText={setIcon}
              maxLength={4}
            />

            <View style={{ gap: theme.spacing.xs }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.rounded.semibold,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Cor
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {CATEGORY_COLORS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setColor(option)}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: option,
                        borderRadius: theme.radius.full,
                        borderWidth: color === option ? 3 : 0,
                        borderColor: theme.colors.textPrimary,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {CATEGORY_TYPES.map((option) => (
                <Button
                  key={option.value}
                  label={option.label}
                  variant={type === option.value ? 'primary' : 'outline'}
                  onPress={() => setType(option.value)}
                />
              ))}
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
  colorDot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  colorSwatch: {
    width: 32,
    height: 32,
  },
});
