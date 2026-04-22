import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Stack,
  Alert,
  Card,
  CardContent,
  Pagination,
  SwipeableDrawer,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import { useAppContext } from '../../../context/AppContext';
import { apiClient } from '../../../api/client';
import { syncMutationNowOrEnqueue } from '../../../hooks/useOfflineSync';

const PAGE_SIZE = 5;

export default function CategoriesManager() {
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const { showSnackbar, showConflict } = useAppContext();
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [name, setName] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const paginatedCategories = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return categories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [categories, page]);

  const totalPages = Math.ceil(categories.length / PAGE_SIZE);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setPanelOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (saving) return;

    setSaving(true);
    try {
      let categoryId = editingCategory?.id;

      if (!editingCategory) {
        try {
          const response = await apiClient.getNextCategoryId();
          categoryId = response.next_id;
        } catch (idError) {
          console.warn('Failed to fetch numeric ID, using temporary UUID:', idError);
          categoryId = crypto.randomUUID();
        }
      }

      const categoryData = {
        id: categoryId,
        name: name.trim(),
        updated_at: editingCategory?.updated_at || ''
      };

      await db.categories.put(categoryData);

      setSaving(false);
      setPanelOpen(false);

      const result = await syncMutationNowOrEnqueue(
        {
          entity: 'categories',
          action: editingCategory ? 'update' : 'create',
          payload: categoryData
        },
        {
          onConflict: async (entityName, localData, remoteData) =>
            new Promise((resolve) => {
              showConflict(entityName, localData, remoteData, resolve);
            })
        }
      );

      showSnackbar(
        `Category ${editingCategory ? 'updated' : 'added'} ${result.status === 'synced' ? 'and synced.' : 'locally and queued for sync.'}`,
        'success'
      );
    } catch (error) {
      setSaving(false);
      showSnackbar('Error saving category: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const existingCategory = categories.find((category) => String(category.id) === String(id));
        await db.categories.delete(id);
        const result = await syncMutationNowOrEnqueue(
          {
            entity: 'categories',
            action: 'delete',
            payload: { id, updated_at: existingCategory?.updated_at || '' }
          },
          {
            onConflict: async (entityName, localData, remoteData) =>
              new Promise((resolve) => {
                showConflict(entityName, localData, remoteData, resolve);
              })
          }
        );

        showSnackbar(
          result.status === 'synced'
            ? 'Category deleted and synced.'
            : 'Category deleted locally and queued for sync.',
          'success'
        );
      } catch (error) {
        showSnackbar('Error deleting category', 'error');
      }
    }
  };

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {categories.length} items total
          </Typography>
          <Button 
            variant="text" 
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 600 }}
          >
            Add Category
          </Button>
        </Stack>

        {categories.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No categories found.
          </Alert>
        ) : (
          <Box>
            <List disablePadding>
              {paginatedCategories.map((category) => (
                <ListItem 
                  key={category.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton onClick={() => handleOpenEdit(category)} size="small">
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(category.id)} size="small" color="error">
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                  sx={{ px: 0 }}
                >
                  <ListItemText 
                    primary={category.name} 
                    primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
            
            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                <Pagination 
                  size="small"
                  count={totalPages} 
                  page={page} 
                  onChange={(_, p) => setPage(p)} 
                  color="primary"
                />
              </Stack>
            )}
          </Box>
        )}
      </CardContent>

      <SwipeableDrawer
        anchor="bottom"
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onOpen={() => setPanelOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{ width: '100%', mb: 3 }}>
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
          <Typography variant="h6" fontWeight={700}>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </Typography>
        </Box>

        <Stack spacing={3}>
          <TextField
            autoFocus
            label="Category Name"
            placeholder="e.g. Dairy, Frozen, Pantry"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
          />
          <Button 
            variant="contained" 
            fullWidth 
            size="large"
            onClick={handleSave} 
            disabled={!name.trim()}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            {editingCategory ? 'Update Category' : saving ? 'Adding...' : 'Add Category'}
          </Button>
          <Button 
            variant="text" 
            fullWidth 
            onClick={() => setPanelOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
        </Stack>
        <Box sx={{ height: 20 }} />
      </SwipeableDrawer>
    </Card>
  );
}
