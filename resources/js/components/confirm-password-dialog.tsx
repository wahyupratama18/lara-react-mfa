import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import InputError from '@/components/input-error';

interface ConfirmPasswordDialogProps {
  title?: string;
  content?: string;
  button?: string;
  onConfirmed: () => void;
  children?: React.ReactNode;
}

const ConfirmPasswordDialog: React.FC<ConfirmPasswordDialogProps> = ({
  title = 'Confirm Password',
  content = 'For your security, please confirm your password to continue.',
  button = 'Confirm',
  onConfirmed,
  children,
}) => {
  const [confirmingPassword, setConfirmingPassword] = useState(false);
  const [form, setForm] = useState({
    password: '',
    error: '',
    processing: false,
  });

  const passwordInput = useRef<HTMLInputElement | null>(null);

  const startConfirmingPassword = () => {
    axios.get(route('password.confirmation')).then(response => {
      if (response.data.confirmed) {
        onConfirmed();
      } else {
        setConfirmingPassword(true);
        setTimeout(() => {
          passwordInput.current?.focus();
        }, 250);
      }
    });
  };

  const confirmPassword = () => {
    setForm(prevForm => ({ ...prevForm, processing: true }));

    axios.post(route('password.confirm'), {
      password: form.password,
    }).then(() => {
      setForm(prevForm => ({ ...prevForm, processing: false }));
      closeModal();
      onConfirmed();
    }).catch(error => {
      setForm(prevForm => ({
        ...prevForm,
        processing: false,
        error: error.response.data.errors.password[0],
      }));
      passwordInput.current?.focus();
    });
  };

  const closeModal = () => {
    setConfirmingPassword(false);
    setForm({
      password: '',
      error: '',
      processing: false,
    });
  };

  return (
    <span>
      <span onClick={startConfirmingPassword}>
        {children}
      </span>

      <Dialog open={confirmingPassword} onOpenChange={setConfirmingPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {content}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                ref={passwordInput}
                type="password"
                className="mt-1 block w-3/4"
                placeholder="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyUp={(e) => e.key === 'Enter' && confirmPassword()}
              />

              <InputError message={form.error} />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="ms-3"
              disabled={form.processing}
              onClick={confirmPassword}
            >
              {button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </span>
  );
};

export default ConfirmPasswordDialog;