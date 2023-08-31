# customized calculation for quotation
Welcome to the Customized Calculation for Quotation app developed for ERPNext. This app provides tailored calculation functionality for quotations.

## Installation

To use this customized ERPNext app, follow these steps:
1. Open your terminal.
2. Run the following command to install the app:

```
bench get-app https://github.com/Imorabet/customized-calculation-for-quotation.git
```
## Install the App

1. Navigate to your ERPNext instance's root directory using the terminal.
2. Use the bench command to install the app on your specific site. Replace `[site-name]` with the name of your ERPNext site.

```
bench --site [site-name] install-app test_app
```
## Migrate and Update
After installing the app, you need to perform a database migration to apply any changes the app might introduce to the database schema.

Run the following commands:
```
bench --site [site-name] migrate
bench --site [site-name] clear-cache
```
## Check the App
1. Log in to your ERPNext instance using a browser.
2. Go to the "Help" on your navbar, and then click on "About"
3. Find the newly installed app ("test_app") in the list and then it is ready to use.
