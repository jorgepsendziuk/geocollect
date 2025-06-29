import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Searchbar,
  Menu,
  IconButton,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';

const FormsScreen = ({navigation}) => {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [categories, setCategories] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadForms();
    }, [])
  );

  const loadForms = async () => {
    try {
      setRefreshing(true);
      const formsData = await DatabaseService.getForms();
      setForms(formsData);
      setFilteredForms(formsData);
      
      // Extract unique categories
      const uniqueCategories = [
        'all',
        ...new Set(formsData.map(form => form.category).filter(Boolean))
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading forms:', error);
      Alert.alert('Erro', 'Não foi possível carregar os formulários');
    } finally {
      setRefreshing(false);
    }
  };

  const filterForms = useCallback(() => {
    let filtered = forms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(form =>
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (form.category && form.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(form => form.category === selectedCategory);
    }

    setFilteredForms(filtered);
  }, [forms, searchQuery, selectedCategory]);

  useEffect(() => {
    filterForms();
  }, [filterForms]);

  const handleFormPress = (form) => {
    navigation.navigate('DataCollection', {formId: form.id, form});
  };

  const handleEditForm = (form) => {
    navigation.navigate('FormBuilder', {formId: form.id, mode: 'edit'});
  };

  const handleDuplicateForm = async (form) => {
    try {
      const duplicatedForm = {
        ...form,
        id: undefined, // Let the database generate a new ID
        title: `${form.title} (Cópia)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove the form's current ID from fields and generate new ones
      const duplicatedFields = form.fields.map(field => ({
        ...field,
        id: undefined,
        formId: undefined, // Will be set when saving
      }));

      duplicatedForm.fields = duplicatedFields;

      Alert.alert(
        'Duplicar Formulário',
        `Deseja duplicar o formulário "${form.title}"?`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Duplicar',
            onPress: () => {
              navigation.navigate('FormBuilder', {
                form: duplicatedForm,
                mode: 'duplicate'
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error duplicating form:', error);
      Alert.alert('Erro', 'Não foi possível duplicar o formulário');
    }
  };

  const handleDeleteForm = (form) => {
    Alert.alert(
      'Excluir Formulário',
      `Tem certeza que deseja excluir o formulário "${form.title}"? Esta ação não pode ser desfeita.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call an API to delete
              // For now, we'll just remove from local state
              Alert.alert('Info', 'Função de exclusão será implementada');
            } catch (error) {
              console.error('Error deleting form:', error);
              Alert.alert('Erro', 'Não foi possível excluir o formulário');
            }
          }
        }
      ]
    );
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'all':
        return 'Todas as Categorias';
      default:
        return category || 'Sem Categoria';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const renderFormCard = ({item: form}) => (
    <Card style={styles.formCard}>
      <Card.Content>
        <View style={styles.formHeader}>
          <View style={styles.formInfo}>
            <Title style={styles.formTitle}>{form.title}</Title>
            {form.description && (
              <Paragraph style={styles.formDescription}>
                {form.description}
              </Paragraph>
            )}
            <View style={styles.formMeta}>
              <Text style={styles.versionText}>v{form.version}</Text>
              <Text style={styles.dateText}>
                Atualizado em {formatDate(form.updatedAt)}
              </Text>
            </View>
          </View>
          
          <Menu
            visible={showCategoryMenu === form.id}
            onDismiss={() => setShowCategoryMenu(null)}
            anchor={
              <IconButton
                icon="more-vert"
                size={20}
                onPress={() => setShowCategoryMenu(form.id)}
              />
            }>
            <Menu.Item
              leadingIcon="edit"
              title="Editar"
              onPress={() => {
                setShowCategoryMenu(null);
                handleEditForm(form);
              }}
            />
            <Menu.Item
              leadingIcon="content-copy"
              title="Duplicar"
              onPress={() => {
                setShowCategoryMenu(null);
                handleDuplicateForm(form);
              }}
            />
            <Menu.Item
              leadingIcon="delete"
              title="Excluir"
              onPress={() => {
                setShowCategoryMenu(null);
                handleDeleteForm(form);
              }}
            />
          </Menu>
        </View>

        <View style={styles.formBadges}>
          {form.category && (
            <Chip icon="category" compact style={styles.categoryChip}>
              {form.category}
            </Chip>
          )}
          {form.requireGPS && (
            <Chip icon="location-on" compact style={styles.requirementChip}>
              GPS Obrigatório
            </Chip>
          )}
          {form.requirePhotos && (
            <Chip icon="camera-alt" compact style={styles.requirementChip}>
              Fotos Obrigatórias
            </Chip>
          )}
          {form.allowOffline && (
            <Chip icon="offline-pin" compact style={styles.offlineChip}>
              Offline
            </Chip>
          )}
        </View>

        <View style={styles.fieldsSummary}>
          <Icon name="assignment" size={16} color="#666" />
          <Text style={styles.fieldsText}>
            {form.fields?.length || 0} campos
          </Text>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          icon="edit"
          onPress={() => handleEditForm(form)}>
          Editar
        </Button>
        <Button
          mode="contained"
          icon="play-arrow"
          onPress={() => handleFormPress(form)}>
          Usar Formulário
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="description" size={64} color="#BDBDBD" />
      <Title style={styles.emptyTitle}>Nenhum formulário encontrado</Title>
      <Paragraph style={styles.emptyText}>
        {searchQuery || selectedCategory !== 'all'
          ? 'Tente ajustar os filtros de busca'
          : 'Crie seu primeiro formulário para começar a coletar dados'}
      </Paragraph>
      {!searchQuery && selectedCategory === 'all' && (
        <Button
          mode="contained"
          icon="add"
          style={styles.emptyButton}
          onPress={() => navigation.navigate('FormBuilder', {mode: 'create'})}>
          Criar Primeiro Formulário
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar formulários..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <Menu
          visible={showCategoryMenu === 'filter'}
          onDismiss={() => setShowCategoryMenu(null)}
          anchor={
            <Button
              mode="outlined"
              icon="filter-list"
              onPress={() => setShowCategoryMenu('filter')}
              style={styles.filterButton}>
              {getCategoryText(selectedCategory)}
            </Button>
          }>
          {categories.map(category => (
            <Menu.Item
              key={category}
              title={getCategoryText(category)}
              onPress={() => {
                setSelectedCategory(category);
                setShowCategoryMenu(null);
              }}
              leadingIcon={category === selectedCategory ? 'check' : undefined}
            />
          ))}
        </Menu>
      </Surface>

      <FlatList
        data={filteredForms}
        renderItem={renderFormCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadForms} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => navigation.navigate('FormBuilder', {mode: 'create'})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  formCard: {
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formInfo: {
    flex: 1,
    marginRight: 8,
  },
  formTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  formBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E3F2FD',
  },
  requirementChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#FFF3E0',
  },
  offlineChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E8F5E8',
  },
  fieldsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldsText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FormsScreen;