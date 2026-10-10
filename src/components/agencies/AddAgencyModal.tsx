import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { Building2 } from 'lucide-react';
import { Agency } from '../../types';

interface AddAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (agency: Agency) => void;
}

export const AddAgencyModal: React.FC<AddAgencyModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createAgency } = useApp();

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const created = createAgency({
        name: name.trim(),
        contactPerson: contactPerson.trim() || 'Operations Lead',
        phone: phone.trim() || '+1 (555) 000-0000',
        email: email.trim() || 'dispatch@agency.com',
        address: address.trim() || 'Port Terminal Hub',
        status,
      });

      setIsSubmitting(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      onClose();
      if (onCreated) onCreated(created);
    }, 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title="Add Clearing Agency"
        description="Register a new customs clearing agency partner in the system."
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-3 py-2 text-xs">
          <div>
            <label className="block text-xs font-semibold text-neutral-900 mb-1">
              Agency Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pacific Coast Clearing Services"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Johnathan Miller"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Official Email
            </label>
            <input
              type="email"
              placeholder="clearance@pacificclearing.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Terminal Address / Facility
            </label>
            <textarea
              rows={2}
              placeholder="Terminal Berth 7, Gate C, Logistics Boulevard"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-black resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Operational Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-black"
            >
              <option value="Active">Active (Eligible for allocations)</option>
              <option value="Inactive">Inactive (Suspended)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              loading={isSubmitting}
              disabled={!name.trim() || isSubmitting}
              className="text-xs bg-black text-white hover:bg-neutral-800"
            >
              Create Agency
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
