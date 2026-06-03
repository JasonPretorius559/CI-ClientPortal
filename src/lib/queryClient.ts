import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        if (failureCount >= 2) return false;
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
        return true;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
