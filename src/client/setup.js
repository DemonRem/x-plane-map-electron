/* global document, window */
/* eslint no-alert:"off", import/no-extraneous-dependencies: "off" */
import $ from 'jquery';
import url from 'url';
import { ipcRenderer } from 'electron';

import './stylesheets/setup.less';

let config = ipcRenderer.sendSync('getConfig');

let hash = document.location.hash.substring(1);

function changeTab() {
  hash = document.location.hash.substring(1);
  $('section').hide();
  $(document).find(`section[data-section-id="${hash}"]`).show();

  $('nav a').removeClass('active');
  $('nav').find(`a[href="#${hash}"]`).addClass('active');
}

function fillConfig() {
  $(document).find('[data-bind]').each(() => {
    const configOption = $(this).attr('data-bind');
    $(this).text(config[configOption]);
  });
  $(document).find('[data-bind-value]').each(() => {
    const configOption = $(this).attr('data-bind-value');
    $(this).val(config[configOption]);
  });
}

function validateIP(ip) {
  return ip.match(/^(\d{1,3}\.){3}\d{1,3}$/);
}

function validatePort(port) {
  const intPort = parseInt(port, 10);
  return intPort > 1024 && intPort < 65536;
}

$('#remoteConfigForm').submit((evt) => {
  evt.preventDefault();
  const values = $(this).serializeArray();
  const ip = values[0].value;
  const port = values[1].value;
  if (!validateIP(ip)) return window.alert('The IP you entered is not a valid IPv4.');
  if (!validatePort(port)) return window.alert('The port you entered is not valid. It should be an integer between 1 and 65535.');

  $.get(`http://${ip}:${port}/api/config`)
    .then((remoteConfig) => {
      config.remoteServerIP = ip;
      config.remoteMapServerPort = parseInt(port);
      config.remoteXPlanePort = remoteConfig.xPlanePort;
      fillConfig();

      // eslint-disable-next-line no-undef
      ipcRenderer.sendSync('setConfig', ({ remoteXPlanePort, remoteMapServerPort, remoteServerIP } = config));
      $('#mapServerConnectionSuccess').show();
      $('#mapServerConnectionFailure').hide();
    })
    .catch(() => {
      $('#mapServerConnectionFailure').show();
      $('#mapServerConnectionSuccess').hide();
    });
  return null;
});

$('#localConfigForm').submit((evt) => {
  evt.preventDefault();
  const values = $(this).serializeArray();
  let xPlanePort = values[0].value;
  let mapServerPort = values[1].value;
  let mapTilesUrl = values[2].value;

  if (!validatePort(xPlanePort)) return window.alert('The X-Plane port you entered is not valid. It should be an integer between 1 and 65535.');
  if (!validatePort(mapServerPort)) return window.alert('The map server port you entered is not valid. It should be an integer between 1 and 65535.');

  config.xPlanePort = parseInt(xPlanePort);
  config.mapServerPort = parseInt(mapServerPort);
  config.mapTilesUrl = mapTilesUrl;

  ipcRenderer.sendSync('setConfig', ({ xPlanePort, mapServerPort, mapTilesUrl } = config));
  fillConfig();

  return null;
});

$('#configReset').click(() => {
  config = ipcRenderer.sendSync('resetConfig');
  fillConfig();
});

$('.submit-button').click(() => {
  if (hash === 'multi-client') {
    config.mode = 'remote';
  } else {
    config.mode = 'local';
  }
  document.location.replace(url.format({
    pathname: document.location.pathname.replace('setup.html', 'app.html'),
    protocol: 'file:',
    slashes: true,
    query: { ...config },
  }));
});

$(document).ready(() => {
  $(window).bind('hashchange', changeTab);

  fillConfig();
  changeTab();
  $('#mapServerConnectionFailure').hide();
  $('#mapServerConnectionSuccess').hide();
});
