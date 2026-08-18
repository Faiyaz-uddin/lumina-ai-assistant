@description('Azure region where NCasT4_v3 capacity is available.')
param location string = resourceGroup().location

@description('Globally unique lowercase ACR name, 5-50 characters.')
param acrName string = 'lumina${uniqueString(resourceGroup().id)}'

@description('Administrator name for the Ubuntu VM.')
param vmAdminUsername string

@secure()
@description('SSH public key used for VM login.')
param sshPublicKey string

@description('CIDR allowed to access SSH. Restrict this to your public IP for production.')
param allowedSshCidr string = '*'

@description('GPU VM SKU. NC4as_T4_v3 has one NVIDIA T4 GPU.')
param vmSize string = 'Standard_NC4as_T4_v3'

var prefix = 'lumina-${uniqueString(resourceGroup().id)}'
var vnetName = '${prefix}-vnet'
var nsgName = '${prefix}-nsg'
var publicIpName = '${prefix}-pip'
var nicName = '${prefix}-nic'
var vmName = '${prefix}-gpu'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.10.0.0/16'] }
    subnets: []
  }
}

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' = {
  parent: vnet
  name: 'app'
  properties: { addressPrefix: '10.10.1.0/24' }
}

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-01-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      { name: 'https'; properties: { priority: 100, protocol: 'Tcp', access: 'Allow', direction: 'Inbound', sourceAddressPrefix: '*', sourcePortRange: '*', destinationAddressPrefix: '*', destinationPortRange: '443' } }
      { name: 'http-bootstrap'; properties: { priority: 110, protocol: 'Tcp', access: 'Allow', direction: 'Inbound', sourceAddressPrefix: '*', sourcePortRange: '*', destinationAddressPrefix: '*', destinationPortRange: '80' } }
      { name: 'ssh'; properties: { priority: 120, protocol: 'Tcp', access: 'Allow', direction: 'Inbound', sourceAddressPrefix: allowedSshCidr, sourcePortRange: '*', destinationAddressPrefix: '*', destinationPortRange: '22' } }
    ]
  }
}

resource pip 'Microsoft.Network/publicIPAddresses@2024-01-01' = {
  name: publicIpName
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource nic 'Microsoft.Network/networkInterfaces@2024-01-01' = {
  name: nicName
  location: location
  properties: {
    networkSecurityGroup: { id: nsg.id }
    ipConfigurations: [{ name: 'ipconfig'; properties: { privateIPAllocationMethod: 'Dynamic', publicIPAddress: { id: pip.id }, subnet: { id: subnet.id } } }]
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2024-03-01' = {
  name: vmName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    hardwareProfile: { vmSize: vmSize }
    osProfile: {
      computerName: vmName
      adminUsername: vmAdminUsername
      linuxConfiguration: { disablePasswordAuthentication: true, ssh: { publicKeys: [{ path: '/home/${vmAdminUsername}/.ssh/authorized_keys'; keyData: sshPublicKey }] } }
      customData: base64(loadTextContent('cloud-init.yaml'))
    }
    storageProfile: {
      imageReference: { publisher: 'Canonical'; offer: 'ubuntu-24_04-lts'; sku: 'server'; version: 'latest' }
      osDisk: { createOption: 'FromImage', managedDisk: { storageAccountType: 'Premium_LRS' } }
    }
    networkProfile: { networkInterfaces: [{ id: nic.id, properties: { primary: true } }] }
  }
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, vm.id, 'AcrPull')
  scope: acr
  properties: {
    principalId: vm.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalType: 'ServicePrincipal'
  }
}

output publicIpAddress string = pip.properties.ipAddress
output registryLoginServer string = acr.properties.loginServer
output vmName string = vm.name
