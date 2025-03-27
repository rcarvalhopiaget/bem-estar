import Cookies from 'js-cookie';

const SESSION_KEY = 'session';

export const setSessionCookie = (token: string) => {
  Cookies.set(SESSION_KEY, token, {
    expires: 7, // 7 dias
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
};

export const getSessionCookie = (): string | undefined => {
  return Cookies.get(SESSION_KEY);
};

export const removeSessionCookie = () => {
  Cookies.remove(SESSION_KEY, { path: '/' });
}; 