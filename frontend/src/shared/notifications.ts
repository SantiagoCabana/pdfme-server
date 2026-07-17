import Swal from 'sweetalert2';

const toast = Swal.mixin({
  didOpen: (popup) => {
    popup.style.cursor = 'pointer';
    popup.addEventListener('click', () => Swal.close());
  },
  toast: true,
  position: 'top-start',
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
});

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function notifyError(error: unknown, fallback = 'Ocurrio un error.') {
  const message = getErrorMessage(error, fallback);
  console.error(fallback, error);
  void toast.fire({ icon: 'error', title: message });
}

export async function notifySuccess(message: string) {
  await toast.fire({ icon: 'success', title: message });
}

export async function confirmDanger(options: {
  title?: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) {
  const result = await Swal.fire({
    cancelButtonText: options.cancelButtonText ?? 'No',
    confirmButtonColor: '#d33',
    confirmButtonText: options.confirmButtonText ?? 'Sí',
    icon: 'warning',
    showCancelButton: true,
    text: options.text,
    title: options.title ?? 'Confirmar eliminación',
  });

  return result.isConfirmed;
}
