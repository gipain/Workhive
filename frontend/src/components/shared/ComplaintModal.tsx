import { useState } from 'react';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
}

export function ComplaintModal({ isOpen, onClose, targetUserId, targetName }: ComplaintModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      toast.error('Опис скарги має бути не менше 10 символів');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/admin/complaints', {
        target_user_id: targetUserId,
        reason: reason.trim(),
      });
      toast.success('Скаргу подано. Адміністратор розгляне її найближчим часом.');
      setReason('');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Помилка';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Подати скаргу">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200/60 rounded-xl p-3">
          <AlertTriangle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">
            Ви подаєте скаргу на <strong>{targetName}</strong>. Адміністратор розгляне її та вживе відповідних заходів.
          </p>
        </div>
        <TextArea
          label="Причина скарги"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Опишіть детально причину вашої скарги (мінімум 10 символів)..."
          rows={5}
          required
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>Скасувати</Button>
          <Button type="submit" variant="danger" isLoading={loading}>
            <AlertTriangle size={14} /> Подати скаргу
          </Button>
        </div>
      </form>
    </Modal>
  );
}
