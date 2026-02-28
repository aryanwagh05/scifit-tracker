import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from '@/src/shared/ui/styles';

export function AICameraGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>AI Camera Training Guide</Text>

          <Text style={styles.modalLine}>Upload: `mp4/mov` (max 90s) or `jpg/png` (max 10MB)</Text>
          <Text style={styles.modalLine}>Storage: `media/{'{user_id}'}/{'{date}'}/...` in Supabase Storage</Text>
          <Text style={styles.modalLine}>AI Input: public URL + structured instructions JSON</Text>
          <Text style={styles.modalLine}>AI Output: strict JSON (form checks, notes, confidence)</Text>
          <Text style={styles.modalLine}>Persist: result saved to `media_uploads.ai_result` + status</Text>

          <Pressable style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
