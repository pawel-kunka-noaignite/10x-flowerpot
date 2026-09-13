resource groupIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '10x-flowerpot-group-identity'
  location: resourceGroup().location
}

module groupContributorModule '../roles/privileged/contributor.bicep' = {
  name: 'iam-group-contributor'
  params: {
    principalId: groupIdentity.properties.principalId
  }
}

module groupRbacAdministrationRoleModule '../roles/privileged/rbac-administrator.bicep' = {
  name: 'iam-group-rbac-administration'
  params: {
    principalId: groupIdentity.properties.principalId
  }
}

output id string = groupIdentity.id
output clientId string = groupIdentity.properties.clientId
output principalId string = groupIdentity.properties.principalId
