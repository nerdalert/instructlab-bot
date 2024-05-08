import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { NotFound } from '@app/NotFound/NotFound';
import { ChatForm } from '@app/Chat/Chat';
import ILChatSettings from "@app/ILSettings/ILSettings";

export interface IAppRoute {
  label?: string;
  path: string;
  title: string;
  element: React.ReactNode;
  routes?: IAppRoute[];
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

const routes: Array<IAppRoute | IAppRouteGroup> = [
  {
    path: '/',
    element: <ChatForm />,
    label: 'InstructLab Chat',
    title: 'InstructLab Chat',
  },
  {
    path: '/settings',
    element: <ILChatSettings />,
    label: 'InstructLab Settings',
    title: 'InstructLab Settings',
  },
  {
    path: '*',
    element: <NotFound />,
    title: '404 Not Found',
  },
];

export const AppRoutes = (): React.ReactElement => (
  <Routes>
    {routes.map((route, idx) =>
      'routes' in route ? (
        route.routes?.map((subRoute) => (
          <Route key={subRoute.path} path={subRoute.path} element={subRoute.element} />
        ))
      ) : (
        <Route key={route.path} path={route.path} element={route.element} />
      ),
    )}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export { AppRoutes, routes };
