import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useMemo } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import axios from 'axios';
import ConfirmPasswordDialog from '@/components/confirm-password-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Two Factor Authentication Settings',
        href: '/settings/two-factor',
    },
];

export default function TwoFactor({ requiresConfirmation }: { requiresConfirmation: boolean; }) {
    const { auth } = usePage<SharedData>().props;

    const [enabling, setEnabling] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [disabling, setDisabling] = useState(false);
    const [qrCode, setQrCode] = useState<HTMLOrSVGElement | null>(null);
    const [setupKey, setSetupKey] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const twoFactorEnabled = useMemo(() => !enabling && auth.user?.two_factor_enabled, [enabling, auth]);

    const { data, setData, post, reset, errors } = useForm({
        code: '',
    });

    useEffect(() => {
        if (!twoFactorEnabled) {
            reset('code');
        }
    }, [twoFactorEnabled, reset]);

    const enableTwoFactorAuthentication = () => {
        setEnabling(true);
    
        router.post(route('two-factor.enable'), {}, {
            preserveScroll: true,
            onSuccess: () => Promise.all([
                showQrCode(),
                showSetupKey(),
                showRecoveryCodes(),
            ]),
            onFinish: () => {
                setEnabling(false);
                setConfirming(requiresConfirmation);
            },
        });
    };

    const showQrCode = async () => {
        const response = await axios.get(route('two-factor.qr-code'));
        setQrCode(response.data.svg);
    };
    
    const showSetupKey = async () => {
        const response = await axios.get(route('two-factor.secret-key'));
        setSetupKey(response.data.secretKey);
    }
    
    const showRecoveryCodes = async () => {
        const response = await axios.get(route('two-factor.recovery-codes'));
        setRecoveryCodes(response.data);
    };
    
    const confirmTwoFactorAuthentication = () => {
        // e.preventDefault();

        post(route('two-factor.confirm'), {
            errorBag: "confirmTwoFactorAuthentication",
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setConfirming(false);
                setQrCode(null);
                setSetupKey(null);
            },
        });
    };
    
    const regenerateRecoveryCodes = () => {
        axios
            .post(route('two-factor.recovery-codes'))
            .then(() => showRecoveryCodes());
    };
    
    const disableTwoFactorAuthentication = () => {
        setDisabling(true);
    
        router.delete(route('two-factor.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                setDisabling(false);
                setConfirming(false);
            },
        });
    };
    
    const description = "When two factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Authenticator application.";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two factor settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Two Factor Authentication" description="Add additional security to your account using two factor authentication." />

                    <HeadingSmall title={twoFactorEnabled && ! confirming
                        ? 'You have enabled two factor authentication.'
                        : (twoFactorEnabled && confirming ? 'Finish enabling two factor authentication.' : 'You have not enabled two factor authentication.')
                    } description={description} />

                    { twoFactorEnabled && (
                        <div className="space-y-6">
                            { qrCode && (
                                <>
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        { confirming ? (
                                            <span className="font-semibold">
                                                To finish enabling two factor authentication, scan the following QR code using your phone's authenticator application or enter the setup key and provide the generated OTP code.
                                            </span>
                                        ) : (
                                            <span>
                                                Two factor authentication is now enabled. Scan the following QR code using your phone's authenticator application or enter the setup key.
                                            </span>
                                        )}
                                    </p>

                                    <div className="mt-4 p-2 inline-block bg-white" dangerouslySetInnerHTML={{ __html: qrCode }} />

                                    { setupKey && (
                                        <p className="mt-4 text-sm text-muted-foreground font-semibold">
                                            Setup Key: <span>{setupKey}</span>
                                        </p>
                                    )}

                                    { confirming && (
                                        <div className="grid gap-2 mt-4">
                                            <Label htmlFor="code">Code</Label>
                                            <Input
                                                id="code"
                                                className="mt-1 block w-full"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                required
                                                autoComplete="one-time-code"
                                                placeholder="Confirmation Code"
                                                onKeyUp={(e) => {
                                                    if (e.key === 'Enter') {
                                                        confirmTwoFactorAuthentication();
                                                    }
                                                }}
                                            />
                                            <InputError className="mt-2" message={errors.code} />
                                        </div>
                                    )}
                                </>
                            )}

                            { (recoveryCodes.length > 0 && ! confirming) && (
                                <>
                                    <p className="mt-4 text-sm text-muted-foreground font-semibold">
                                        Store these recovery codes in a secure password manager. They can be used to recover access to your account if your two factor authentication device is lost.
                                    </p>

                                    <div className="grid gap-2 mt-4 px-4 py-4 font-mono text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-lg">
                                        { recoveryCodes.map((code) => (
                                            <div key={code}>{ code }</div>
                                        )) }
                                    </div>
                                </>
                            ) }
                        </div>
                    )}

                    <div className="mt-5">
                        { twoFactorEnabled ? (
                            <>
                                {confirming && (
                                    <ConfirmPasswordDialog onConfirmed={confirmTwoFactorAuthentication}>
                                        <Button type="button" className={`me-3 ${enabling ? 'opacity-25' : ''}`} disabled={enabling}>
                                            Confirm
                                        </Button>
                                    </ConfirmPasswordDialog>
                                )}

                                {(recoveryCodes.length > 0 && ! confirming) && (
                                    <ConfirmPasswordDialog onConfirmed={regenerateRecoveryCodes}>
                                        <Button variant="secondary" type="button" className="me-3">
                                            Regenerate Recovery Codes
                                        </Button>
                                    </ConfirmPasswordDialog>
                                )}

                                {(recoveryCodes.length === 0 && ! confirming) && (
                                    <ConfirmPasswordDialog onConfirmed={showRecoveryCodes}>
                                        <Button variant="secondary" type="button" className="me-3">
                                            Show Recovery Codes
                                        </Button>
                                    </ConfirmPasswordDialog>
                                )}

                                {confirming ? (
                                    <ConfirmPasswordDialog onConfirmed={disableTwoFactorAuthentication}>
                                        <Button variant="secondary" type="button" className="me-3" disabled={disabling}>
                                            Cancel
                                        </Button>
                                    </ConfirmPasswordDialog>
                                ) : (
                                    <ConfirmPasswordDialog onConfirmed={disableTwoFactorAuthentication}>
                                        <Button variant="destructive" type="button" className="me-3" disabled={disabling}>
                                            Disable
                                        </Button>
                                    </ConfirmPasswordDialog>
                                )}
                            </>
                        ) : (
                            <ConfirmPasswordDialog onConfirmed={enableTwoFactorAuthentication}>
                                <Button type="button" className={ enabling ? 'opacity-25' : '' } disabled={enabling}>
                                    Enable
                                </Button>
                            </ConfirmPasswordDialog>
                        )}
                    </div>
                </div>

            </SettingsLayout>
        </AppLayout>
    );
}