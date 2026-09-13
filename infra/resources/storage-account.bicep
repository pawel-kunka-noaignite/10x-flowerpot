param swaIdentityPrincipalId string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '10xflowerpot'
  location: resourceGroup().location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }

  resource tableService 'tableServices' = {
    name: 'default'
  }
}

module storageTableDataContributorRoleModule '../roles/storage-table-data-contributor.bicep' = {
  name: 'iam-swa-storage-table-data-contributor'
  params: {
    storageAccountName: storageAccount.name
    principalId: swaIdentityPrincipalId
  }
}

output name string = storageAccount.name
output id string = storageAccount.id
