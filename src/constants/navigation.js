import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ShoppingCartCheckoutRoundedIcon from '@mui/icons-material/ShoppingCartCheckoutRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';

export const navigationItems = [
  { label: 'Dashboard', path: '/', icon: DashboardRoundedIcon },
  { label: 'Trips', path: '/trips', icon: ShoppingCartCheckoutRoundedIcon },
  { label: 'Inventory', path: '/inventory', icon: InventoryRoundedIcon },
  { label: 'Price History', path: '/price-history', icon: HistoryRoundedIcon }
];

export const managementItems = [
  { label: 'Management', path: '/managers', icon: ManageAccountsRoundedIcon }
];
