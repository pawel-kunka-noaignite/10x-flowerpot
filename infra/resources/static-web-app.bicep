resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '10x-flowerpot-swa'
  location: resourceGroup().location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output name string = staticWebApp.name
output hostname string = staticWebApp.properties.defaultHostname
