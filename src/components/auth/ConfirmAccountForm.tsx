'use client';

import { confirmAccount } from '@/actions/auth/confirmAccountAction';
import { PinInput, PinInputField } from '@chakra-ui/pin-input';
import { MailCheck, Repeat, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function ConfirmAccountForm() {
  const [token, setToken] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  const confirmAccountWithToken = confirmAccount.bind(null, token);
  const [state, dispatch] = useActionState(confirmAccountWithToken, {
    errors: [],
    success: '',
  });

  useEffect(() => {
    if (isCompleted) {
      startTransition(() => dispatch());
    }
  }, [isCompleted, dispatch]);

  useEffect(() => {
    if (state?.errors?.length) state.errors.forEach((e: string) => toast.error(e));
    if (state?.success) {
      toast.success(state.success);
      window.setTimeout(() => router.push('/auth/login'), 900);
    }
  }, [state, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleChange = (value: string) => {
    setIsCompleted(false);
    setToken(value);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    toast('Si tu cuenta existe, te hemos reenviado un codigo.');
    setCooldown(30);
  };

  const triangles = Array.from({ length: 120 });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(110deg, #f9fafb 48%, #ffffff 48%)' }} />

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`l-${i}`} className="mx-auto h-5 w-5 bg-red-50 clip-triangle" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden opacity-40 lg:block">
        <div className="grid h-full w-full grid-cols-8 gap-3">
          {triangles.map((_, i) => (
            <div key={`r-${i}`} className="mx-auto h-5 w-5 bg-gray-100 clip-triangle" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .clip-triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
      `}</style>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="order-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:order-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-600">
                  <MailCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Confirma tu cuenta</h1>
                  <p className="text-xs text-gray-500">Ingresa el codigo de 6 digitos enviado a tu correo</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <PinInput value={token} onChange={handleChange} onComplete={() => setIsCompleted(true)} otp>
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                    <PinInputField className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100 text-center text-xl" />
                  </PinInput>
                </div>

                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  <Repeat className="h-4 w-4" />
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar codigo'}
                </button>

                <p className="text-center text-xs text-gray-500">
                  ¿Es el correo correcto? Si no tienes acceso, vuelve al{' '}
                  <Link href="/auth/register" className="font-medium text-red-600 underline underline-offset-2 hover:text-red-700">registro</Link> y usa un email distinto.
                </p>
              </div>
            </div>

            <div className="order-1 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm sm:order-2">
              <div className="mb-4 flex items-center gap-2 text-gray-800">
                <ShieldCheck className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold">Consejos rapidos</span>
              </div>
              <ul className="list-disc space-y-2 pl-5 text-xs text-gray-600">
                <li>Revisa <span className="font-medium text-gray-800">Spam</span> o <span className="font-medium text-gray-800">Promociones</span> si no ves el correo.</li>
                <li>El codigo expira por seguridad. Si caduca, solicita uno nuevo.</li>
                <li>Evita copiar o pegar con espacios. Escribe los 6 digitos manualmente.</li>
                <li>Por tu seguridad nunca compartas este codigo con terceros.</li>
              </ul>
              <div className="mt-4 text-xs text-gray-600">
                <p>
                  ¿Necesitas ayuda? Escribenos a{' '}
                  <a href="mailto:soporte@tu-dominio.com" className="text-red-600 underline underline-offset-2 hover:text-red-700">soporte@tu-dominio.com</a>.
                </p>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 text-center">
                <Image
                  src="/econolab-brand.png"
                  alt="Econolab"
                  width={220}
                  height={70}
                  className="h-auto w-full max-w-[200px] object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-600">
            Al continuar aceptas nuestros <Link href="/terms" className="text-red-600 hover:underline">Terminos</Link> y <Link href="/privacy" className="text-red-600 hover:underline">Politica de privacidad</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
