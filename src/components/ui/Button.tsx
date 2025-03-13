import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'touch';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-md font-medium transition-colors duration-200 flex items-center justify-center';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 disabled:bg-secondary/50',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 disabled:border-primary/50 disabled:text-primary/50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
  };

  const sizes = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5',
    lg: 'px-8 py-3 text-lg', 
    touch: 'px-6 py-4 text-xl touch-manipulation',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  );
} 