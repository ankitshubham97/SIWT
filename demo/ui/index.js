import { DAppClient } from '@airgap/beacon-sdk'
import jwt_decode from 'jwt-decode'

import * as siwt from '../../dist/siwt'

import './style.css'

const dAppClient = new DAppClient({ name: 'SIWT Demo' })
const state = { accessToken: '' }

const getProtectedData = () => {
  fetch('http://localhost:3000/protected', {
    method: 'GET',
    headers: {
      authorization: `Bearer ${state.accessToken}`,
    },
  })
    .then(response => response.json())
    .then(data => {
      const protectedDataContainer = document.getElementsByClassName('protected-data-content-container')[0]
      protectedDataContainer.innerHTML = data
    })
    .catch(error => {
      const protectedDataContainer = document.getElementsByClassName('protected-data-content-container')[0]
      protectedDataContainer.innerHTML = error.message
    })
}

const getPublicData = () => {
  fetch('http://localhost:3000/public', {
    method: 'GET',
  })
    .then(response => response.json())
    .then(data => {
      const publicDataContainer = document.getElementsByClassName('public-data-content-container')[0]
      publicDataContainer.innerHTML = data
    })
    .catch(error => {
      const publicDataContainer = document.getElementsByClassName('public-data-content-container')[0]
      publicDataContainer.innerHTML = error.message
    })
}

const login = async () => {
  try {
    // request wallet permissions with Beacon dAppClient
    const walletPermissions = await dAppClient.requestPermissions()

    // create the message to be signed
    const messagePayload = siwt.createMessagePayload({
      dappUrl: 'siwt.stakenow.fi',
      pkh: walletPermissions.address,
    })

    // request the signature
    const signedPayload = await dAppClient.requestSignPayload(messagePayload)

    // sign in the user to our app
    const { data } = await siwt.signIn('http://localhost:3000')({
      pk: walletPermissions.accountInfo.publicKey,
      pkh: walletPermissions.address,
      message: messagePayload.payload,
      signature: signedPayload.signature,
    })

    const { accessToken, idToken } = data
    state.accessToken = accessToken

    const contentContainer = document.getElementsByClassName('content-container')[0]

    if (idToken) {
      const userIdInfo = jwt_decode(idToken)
      contentContainer.innerHTML = `<h3>You are logged in as ${userIdInfo.pkh}</h3>`
    }
  } catch (error) {
    const contentContainer = document.getElementsByClassName('content-container')[0]
    contentContainer.innerHTML = error.message
  }
}

const init = () => {
  const loginButton = document.getElementsByClassName('connect-button')[0]
  const loadPublicDataButton = document.getElementsByClassName('load-public-data-button')[0]
  const loadProtectedDataButton = document.getElementsByClassName('load-private-data-button')[0]
  loginButton.addEventListener('click', login)
  loadPublicDataButton.addEventListener('click', getPublicData)
  loadProtectedDataButton.addEventListener('click', getProtectedData)
}

window.onload = init
