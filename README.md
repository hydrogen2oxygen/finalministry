# FinalMinistry
New Electron version of FinalMinistry, it includes a Territory Designer and Manager

# Versions
...

# Developers
You need to have [Node.js](https://nodejs.org) installed (v18 or higher) and NPM (comes with Node.js). Also install Angular CLI globally:
```bash
npm install -g @angular/cli
```

Then run the following commands to install the dependencies and build the UI:
```bash
# In the root folder
npm install
# In the ui folder
ui/npm install
ui/ng build
```

## Run it
Start the application in developer mode:
```bash
# In the root folder
npm start
# or start both Electron and Angular concurrently
npm run dev
```

## Build the executable
Build it locally as an executable (in Windows you need to open CMD in Admin mode):
```bash
# In the root folder
npm run pack
```
This will create a folder called `release` with the executable and all the files needed to run it. You can copy this folder to any computer and run the executable. The `release` folder will be created in the root folder of the project.

Feel free to contact me if you have questions.