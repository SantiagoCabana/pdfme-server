import { createRoot } from 'react-dom/client';
import 'sweetalert2/dist/sweetalert2.min.css';
import { appName } from './app/config';
import App from './App';

document.title = appName;

createRoot(document.getElementById('root')!).render(<App />);
