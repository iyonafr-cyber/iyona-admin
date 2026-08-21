import { toast, type ToastOptions, type Id } from "react-toastify";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptionsCustom extends ToastOptions {
  duration?: number;
}

class ToastService {
  private defaultOptions: ToastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };

  success(message: string, options?: ToastOptionsCustom): Id {
    return toast.success(message, {
      ...this.defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? this.defaultOptions.autoClose,
      className: "toast-success",
    });
  }

  error(message: string, options?: ToastOptionsCustom): Id {
    return toast.error(message, {
      ...this.defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? this.defaultOptions.autoClose,
      className: "toast-error",
    });
  }

  warning(message: string, options?: ToastOptionsCustom): Id {
    return toast.warning(message, {
      ...this.defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? this.defaultOptions.autoClose,
      className: "toast-warning",
    });
  }

  info(message: string, options?: ToastOptionsCustom): Id {
    return toast.info(message, {
      ...this.defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? this.defaultOptions.autoClose,
      className: "toast-info",
    });
  }

  dismiss(toastId?: Id): void {
    toast.dismiss(toastId);
  }

  dismissAll(): void {
    toast.dismiss();
  }
}

export default new ToastService();
