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
import { db, queueMutation } from '../../../lib/db';
import { useAppContext } from '../../../context/AppContext';
import { apiClient } from '../../../api/client';




const PAGE_SIZE = 5;

export default function StoresManager() {
  const stores = useLiveQuery(() => db.stores.toArray()) || [];
  const { showSnackbar } = useAppContext();
  
  const [editingStore, setEditingStore] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [name, setName] = useState('');
  const [page, setPage] = useState(1);

  const paginatedStores = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return stores.slice(startIndex, startIndex + PAGE_SIZE);
  }, [stores, page]);

  const totalPages = Math.ceil(stores.length / PAGE_SIZE);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setName('');
    setPanelOpen(true);
  };

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setName(store.name);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      let storeId = editingStore?.id;

      if (!editingStore) {
        try {
          const response = await apiClient.getNextStoreId();
          storeId = response.next_id;
        } catch (idError) {
          console.warn('Failed to fetch numeric ID, using temporary UUID:', idError);
          storeId = crypto.randomUUID();
        }
      }

      const storeData = {
        id: storeId,
        name: name.trim()
      };

      await db.stores.put(storeData);
      await queueMutation('stores', editingStore ? 'update' : 'create', storeData);

      
      showSnackbar(`Store ${editingStore ? 'updated' : 'added'} successfully`, 'success');
      setPanelOpen(false);
    } catch (error) {
      showSnackbar('Error saving store: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        await db.stores.delete(id);
        await queueMutation('stores', 'delete', { id });

        showSnackbar('Store deleted', 'success');
      } catch (error) {
        showSnackbar('Error deleting store', 'error');
      }
    }
  };

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {stores.length} items total
          </Typography>
          <Button 
            variant="text" 
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 600 }}
          >
            Add Store
          </Button>
        </Stack>

        {stores.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No stores found.
          </Alert>
        ) : (
          <Box>
            <List disablePadding>
              {paginatedStores.map((store) => (
                <ListItem 
                  key={store.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton onClick={() => handleOpenEdit(store)} size="small">
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(store.id)} size="small" color="error">
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                  sx={{ px: 0 }}
                >
                  <ListItemText 
                    primary={store.name} 
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
            {editingStore ? 'Edit Store' : 'Add Store'}
          </Typography>
        </Box>

        <Stack spacing={3}>
          <TextField
            autoFocus
            label="Store Name"
            placeholder="e.g. S&R, Puregold, Costco"
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
            {editingStore ? 'Update Store' : 'Add Store'}
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
