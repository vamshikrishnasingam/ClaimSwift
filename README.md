> Why do I have a folder named ".expo" in my project?

The ".expo" folder is created when an Expo project is started using "expo start" command.

> What do the files contain?

- "devices.json": contains information about devices that have recently opened this project. This is used to populate the "Development sessions" list in your development builds.
- "packager-info.json": contains port numbers and process PIDs that are used to serve the application to the mobile device/simulator.
- "settings.json": contains the server configuration that is used to serve the application manifest.

> Should I commit the ".expo" folder?

No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.

Upon project creation, the ".expo" folder is already added to your ".gitignore" file.



Open the folder in VS Code

For running Frontend:

    cd ClaimSwift
    npm install
    npx expo start -c

For Running Backend

    cd CDIModel
    python -m venv myenv
    myenv\Scripts\activate  (myenv should be activated everytime when you run the code)
    cd flask_server 
    pip install -r requirements.text
    Install other Dependencies
    cd..
    Use Detectron2 installation file to install detectron2
    cd Server
    python model_test.py


Detectron2 installation steps

    venv\Scripts\activate
    cd detectron2
    python setup.py build develop
    cd..

Further Installations

    pip install torch torchvision torchaudio 
    pip install cython matplotlib pycocotools   
    pip install opencv-python  
    pip install pyyaml   
    python -c "import detectron2; print(detectron2.__version__)" 
    pip install portalocker     
    pip install antlr4-python3-runtime    
    pip install onnxruntime-gpu      
    pip install flask_cors          
    pip install datasets  
    pip install transformers 


Download Files from the below Drive and Paste it in the Respective Folder with folder name

    https://drive.google.com/drive/folders/1vqFbJfFOnpDBKf3WnA6McsgkpHEHnh--?usp=sharing
