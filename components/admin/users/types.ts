export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

export type DoctorProfile = {
  id: string;
  name: string | null;
  specialty: string | null;
  description: string | null;
  photo: string | null;
  active: boolean;
  visible: boolean;
  branches: {
    branchId: string;
  }[];
};

export type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole | string;
  lastLoginAt: Date | string | null;
  doctor: DoctorProfile | null;
};

export type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
};

export type AvailableDoctor = {
  id: string;
  name: string | null;
  specialty: string | null;
  photo: string | null;
  active: boolean;
  visible: boolean;
  branches: {
    branchId: string;
    branch: {
      id: string;
      name: string;
      city: string;
    };
  }[];
};

export type DoctorFormValues = {
  name: string;
  email: string;
  specialty: string;
  description: string;
  photo: string;
  active: boolean;
  branchIds: string[];
};