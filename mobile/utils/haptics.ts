import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Feedback háptico centralizado. En web no hace nada.
 * Usar con moderación: acciones clave, no cada toque.
 */
function available(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** Toque ligero: taps de botones y chips. */
export function hapticTap(): void {
  if (available()) {
    void Haptics.selectionAsync();
  }
}

/** Confirmación exitosa: pago registrado, meta creada, etc. */
export function hapticSuccess(): void {
  if (available()) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Advertencia: cancelaciones, reversas. */
export function hapticWarning(): void {
  if (available()) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/** Error: fallo de red o validación del servidor. */
export function hapticError(): void {
  if (available()) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
