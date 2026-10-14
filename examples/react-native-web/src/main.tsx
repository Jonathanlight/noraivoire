// NoraIvoire — monte le modèle React Native avec react-native-web. © 2026 Jonathan KABLAN — Propriétaire.
import { AppRegistry } from 'react-native';
import App from './template/App';

AppRegistry.registerComponent('NoraIvoire', () => App);
AppRegistry.runApplication('NoraIvoire', { rootTag: document.getElementById('root') });
