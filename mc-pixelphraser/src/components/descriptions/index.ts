
import { lazy } from 'react';

const Descriptions = lazy(
  () => import('./descriptions' /* webpackChunkName: "welcome" */)
);

export default Descriptions;
