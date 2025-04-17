import { PERMISSIONS } from './src/constants'
/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'PixelPhraser',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      initialProjectKey: "pixel-phraser-demo"
    },
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
  },
  oAuthScopes: {
    view: ['view_products'],
    manage: ['manage_products'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/screen.svg}',
  mainMenuLink: {
    defaultLabel: 'PixelPhraser',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
};

export default config;
