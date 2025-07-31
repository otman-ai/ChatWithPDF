import React,{ useCallback } from 'react';

const useApiCall = ({ setErrors }: { setErrors: (error: string) => void }) => {
  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.log(error.error)
        setErrors(error.error)
        return error
      }
      
      return await response.json();
    } catch (error) {
      setErrors("Error")
      console.error('API call failed:', error);
      throw error;
    }
  }, []);

  return { apiCall };
};
export default useApiCall;