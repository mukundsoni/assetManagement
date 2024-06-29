// Import the credentials
import { CLIENT_ID, API_KEY, DISCOVERY_DOCS, SCOPES } from './credentials.js';

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    console.error(JSON.stringify(error, null, 2));
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    fetchData();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

async function fetchData() {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    range: 'Sheet1!A:E',
  });
  const data = response.result.values;
  const assetList = document.getElementById('assetList');
  assetList.innerHTML = '';
  data.forEach((row, index) => {
    const li = document.createElement('li');
    li.textContent = `Name: ${row[0]}, Place: ${row[1]}, Expense 1: ${row[2]}, Expense 2: ${row[3]}, Total: ${row[4]}`;
    li.dataset.rowIndex = index + 1; // Store the row index
    li.addEventListener('click', () => {
      document.getElementById('name').value = row[0];
      document.getElementById('place').value = row[1];
      document.getElementById('expense1').value = row[2];
      document.getElementById('expense2').value = row[3];
      document.getElementById('rowIndex').value = index + 1; // Set the row index
    });
    assetList.appendChild(li);
  });
}

document.getElementById('assetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const place = document.getElementById('place').value;
  const expense1 = document.getElementById('expense1').value;
  const expense2 = document.getElementById('expense2').value;
  const totalExpense = parseFloat(expense1) + parseFloat(expense2);
  const rowIndex = document.getElementById('rowIndex').value;

  const values = [[name, place, expense1, expense2, totalExpense]];
  const range = `Sheet1!A${rowIndex}:E${rowIndex}`;

  if (rowIndex) {
    // Update existing row
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: 'YOUR_SPREADSHEET_ID',
      range: range,
      valueInputOption: 'RAW',
      resource: { values: values },
    });
  } else {
    // Append new row
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: 'YOUR_SPREADSHEET_ID',
      range: 'Sheet1!A:E',
      valueInputOption: 'RAW',
      resource: { values: values },
    });
  }

  fetchData();
  document.getElementById('assetForm').reset();
});

handleClientLoad();
