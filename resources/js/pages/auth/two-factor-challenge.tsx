import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"  
import { REGEXP_ONLY_DIGITS } from 'input-otp';

interface TwoFactorForm {
    code: string;
    recovery_code: string;
}

interface LoginProps {
    status?: string;
    recovery: boolean;
}

export default function TwoFactorChallenge({ status, recovery: initialRecovery }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<TwoFactorForm>({
        code: '',
        recovery_code: '',
    });

    const [recovery, setRecovery] = useState(initialRecovery);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.login.store'), {
            onFinish: () => reset('code', 'recovery_code'),
        });
    };

    const toggleRecovery = () => {
        setRecovery(!recovery);
    };

    useEffect(() => {
        setData(recovery ? 'code' : 'recovery_code', '');
    }, [recovery, setData]);

    return (
        <AuthLayout title="Confirm your code before log in" description={recovery
        ? 'Please confirm access to your account by entering one of your emergency recovery codes.'
        : 'Please confirm access to your account by entering the authentication code provided by your authenticator application.'}>
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    {
                        recovery ? (
                            <div className="grid gap-2">
                                <Label htmlFor="recovery_code">Recovery Code</Label>

                                <Input
                                    id="recovery_code"
                                    type="recovery_code"
                                    required
                                    tabIndex={2}
                                    autoComplete="one-time-code"
                                    value={data.recovery_code}
                                    onChange={(e) => setData('recovery_code', e.target.value)}
                                    placeholder="Recovery code"
                                />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <InputOTP id="code" maxLength={6} pattern={REGEXP_ONLY_DIGITS} onChange={(value) => setData('code', value)} value={data.code}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>

                                <InputError message={errors.code} />
                            </div>
                        )
                    }

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Log in
                    </Button>
                </div>

                <div className="text-center">
                    <Button variant="link" type="button" className="mt-4 w-full" tabIndex={4} onClick={toggleRecovery}>
                        <span>
                            {recovery ? 'Use an authentication code' : 'Use a recovery code'}
                        </span>
                    </Button>
                </div>
            </form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
