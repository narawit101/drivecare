export interface HealthData {
  weight?: number;
  height?: number;
  bmi?: number;
  congenital_diseases?: string[];
  allergies?: string[];
  updated_at?: string;
}

export interface FormData {
  weight: string;
  height: string;
  congenital_diseases: string;
  allergies: string;
}

export interface InputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  isAlert?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  isHighlight?: boolean;
}