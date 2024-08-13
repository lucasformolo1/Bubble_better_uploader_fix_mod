// function update

function(instance, properties, context) {
    
  /*
  
  OBJECT DOCUMENTATION FOR INSTANCE.DATA
  USED IN BOTH ELEMENT ACTIONS AND UPDATE FUNCTION
  
  encodedfiles: Array []
getBase64: async function getBase64(file)
i: number
method: "click" or "drop"
placeholder: "text"
selectedFiles: Array []
stageFiles: function stageFiles(input)
time: unix timestamp
updateLoadingBar: function updateLoadingBar(top, bot)
  reset: function()
  
  */
  
  const debugMode = properties.debug_mode;

  let selectedFiles, placeholder;

  //SETS THE PLACEHOLDER ON THE UPLOADER

  switch (properties.placeholder) {
      case null:
          instance.data.placeholder = "";
          break;
      case undefined:
          instance.data.placeholder = "";
          break;
      case 'undefined':
          instance.data.placeholder = "";
          break;
      default:
          instance.data.placeholder = properties.placeholder;
          placeholder = properties.placeholder;
          //Do nothing
  }
  //APPENDS THE UPLOADER TO THE CANVAS

  if (instance.data.i === 0) {
      instance.canvas.append(`<form class="advanced-form" id="better-uploader-form${instance.data.time}"><label class="advanced-label" id="advanced-label${instance.data.time}"><input type="file" accept="${properties.suggested_file_types}" class="advanced-uploader" id="advanced-uploader${instance.data.time}" multiple="multiple"/><span id="advanced-span${instance.data.time}"></span></label></form>`);

  }

  document.getElementById(`advanced-span${instance.data.time}`).innerText = placeholder; 
  

  const fileInput = document.getElementById(`advanced-uploader${instance.data.time}`);


  function checkFileExtension(acceptedExtensions, files) {

      let errors = 0;

      files.forEach((item) => {
          
    let acceptedExtensionsNoSpaces = acceptedExtensions.split(" ").join("")
          let ext = item.name.toLowerCase().slice((item.name.lastIndexOf(".") - 1 >>> 0) + 2);
          
          switch (acceptedExtensionsNoSpaces.includes("." + ext)) {
              case true:
                  if(debugMode){
                      console.log('A file has a correct type');
                  }
                  //This file is an accepted file extension.
                  break;
              default:
                  if(debugMode){
                      console.log('A file has an incorrect type');
                      console.log(`Accepted Extensions: ${acceptedExtensionsNoSpaces}`)
                      console.log(`This extension: .${ext}`)
                  }
                  errors++;
                  //Does not match this file type
                                                                      }

      });

      if (errors > 0) {
          return false;
      } else {
          return true;
      }
  }

  function checkFileSize(files) {
    let maxSize = properties.bubble.max_size() * 1000000; // Convert MB to bytes
    console.log(`Max file size allowed: ${maxSize} bytes`);

    let errors = 0;

    files.forEach((item) => {
        console.log(`Checking file: ${item.name}, size: ${item.size} bytes`);
        if (item.size > maxSize) {
            console.log(`File ${item.name} is too large. Size: ${item.size} bytes`);
            errors++;
        } else {
            console.log(`File ${item.name} size is within the limit.`);
        }
    });

    return errors === 0;
}

  function checkFilesCount(files) {
      let errors = 0;

      files.forEach((item, index) => {

          if (index + 1 > properties.limit_number_of_files) {
              if(debugMode){
                  console.log('This file exceeds the maximum AMOUNT of files allowed');
              }
              errors++
          } else {
              //Have not exceeded the maximum amount yet
          }

      });

      if (errors > 0) {
          return false;
      } else {
          return true;
      }

  }

  function checkIsUploadAllowed() {
      if (properties.bubble.file_upload_condition() === false) {
          if(debugMode){
              console.log('File upload enabled is set to "no"');
          }
          return false;
      } else {
          //File upload is allowed
          return true;

      }
  }

  instance.data.updateLoadingBar = function(top, bot) {
      let progress = ((top / bot) * 100).toFixed(2);
      instance.publishState("raw_progress", progress);

  }

  // Drop handler function to get all files
  async function getAllFileEntries(dataTransferItemList) {
      let fileEntries = [],
          queue = [];

      // Unfortunately dataTransferItemList is not iterable i.e. no forEach
      for (let i = 0; i < dataTransferItemList.length; i++) {
          queue.push(dataTransferItemList[i].webkitGetAsEntry());
      }
      while (queue.length > 0) {
          let entry = queue.shift();
          if (entry.isFile) {
              fileEntries.push(entry);
          } else if (entry.isDirectory) {
              let reader = entry.createReader();
              queue.push(...await readAllDirectoryEntries(reader));
          }
      }
      return fileEntries;
  }

  // Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(directoryReader) {
      let entries = [];
      let readEntries = await readEntriesPromise(directoryReader);
      while (readEntries.length > 0) {
          entries.push(...readEntries);
          readEntries = await readEntriesPromise(directoryReader);
      }
      return entries;
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  async function readEntriesPromise(directoryReader) {
      try {
          return await new Promise((resolve, reject) => {
              directoryReader.readEntries(resolve, reject);
          });
      } catch (err) {
          console.log(err);
      }
  }

  function updateFileSize(files) {
      let mb = [];
      files.forEach((file) => {
          let size_in_megabytes = file.size / 1e6;
          mb.push(size_in_megabytes);
      });
      return mb;
  }
  /*
    This is the code for handling the staging of files that are uploaded manually
  */
  instance.data.stageFiles = function(input) {
    console.log("Staging files:", input);
    instance.publishState("a_file(s)_is_valid", true);
    instance.data.selectedFiles = input;

    let numerator = 0;
    let denominator = input.length;

    let nameArray = [];
    if (input.length > 0) {
        for (const [index, f] of input.entries()) {
            numerator++;
            instance.data.updateLoadingBar(numerator, denominator);
            nameArray.push(f.name);
            console.log(`Processing file: ${f.name}, size: ${f.size}`);

            if (index === input.length - 1) {
                console.log("All files processed. Updating states.");
                instance.publishState("file_name", nameArray.toString());
                instance.publishState("file_size", updateFileSize(input));
                instance.data.encodedfiles = input; // Store raw file objects
                instance.data.updateLoadingBar(numerator, denominator);
                instance.data.method = 'click';
                instance.triggerEvent("has_a_file");
            }
        }
    } else {
        console.log("No files to stage. Resetting.");
        instance.data.reset();
    }
}
  /*
    This is the code for handling the staging of files or directories that are "dropped"
  */
  async function getFile(fileEntry) {
      try {
          return await new Promise((resolve, reject) => fileEntry.file(resolve, reject));
      } catch (err) {
          console.log(err);
      }
  }

  //Sends data to exposed states, instance variables and the file names to the input
  function sendData(numerator, denominator, files, extensions, names) {
    console.log("Sending data. Files:", files);
    instance.data.updateLoadingBar(numerator, denominator);
    instance.publishState("file_name", names.toString());
    instance.publishState("file_size", updateFileSize(files));
    instance.data.droppedExtensions = extensions;
    instance.data.selectedFiles = files;
    instance.data.encodedfiles = files; // Store raw file objects
    instance.data.method = "drop";
    instance.triggerEvent("has_a_file");
}
    
async function stageDroppedFiles(input) {
    console.log("Staging dropped files:", input);
    instance.publishState("a_file(s)_is_valid", true);
    let items = await input;
    let data = {
        names: [],
        extensions: [],
        files: [],
        numerator: 0,
        denominator: items.length
    };

    return await new Promise((async (resolve, reject) => {
        for (let i = 0; i < items.length; i++) {
            let file = await getFile(items[i]);
            data.names.push(file.name);
            data.extensions.push(file.name.slice(2 + (items[i].name.lastIndexOf(".") - 1 >>> 0)));
            data.files.push(file);
            data.numerator++;
            instance.data.updateLoadingBar(data.numerator, data.denominator);
            console.log(`Processing dropped file: ${file.name}, size: ${file.size}`);

            if (data.files.length === items.length) {
                console.log("All dropped files processed. Resolving data.");
                resolve(data);
            }
        }
    }));
}

  /*

    Here is where the event listners are initiated. We are using instance.data.i to ensure we are only creating event listeners one time per page load

  */

  function buildConditions(files) {
      let conditions = [];

      conditions.push(checkIsUploadAllowed)
      conditions.push(function() {
          return checkFilesCount(files)
      })
      conditions.push(function() {
          return checkFileSize(files)
      })

      if (properties.limit_file_types != null && properties.limit_file_types != undefined && properties.limit_file_types != '') {
          conditions.push(function() {
              return checkFileExtension(properties.limit_file_types, files)
          })
      }

      return conditions;

  }

  function checkConditions(conditions) {
      let errors = 0;

      conditions.forEach((item, index) => {


          if (item() == true) {
              //Condition passed
          }
          if (item() == false) {
              errors++
          }
      })
              

      if (errors > 0) {
          instance.triggerEvent("file_is_invalid")
          instance.publishState("a_file(s)_is_valid", false);
          if(debugMode){
              console.log('Result: There was ' + errors + ' category errors. Staging is cancelled.');
          }
          return false;
      } else {
          instance.publishState("a_file(s)_is_valid", true);
          if(debugMode){
              console.log('Result: There was ' + errors + ' category errors. Staging....');
          }
          return true;
      }


  }




  if (instance.data.i === 0) {
      fileInput.addEventListener('dragover', function(event) {
          event.preventDefault();
          instance.publishState("a_file_or_folder_is_hovering", true);
      });
  }
  if (instance.data.i === 0) {
      fileInput.addEventListener('dragleave', function(event) {
          event.preventDefault();
          instance.publishState("a_file_or_folder_is_hovering", false);
      });
  }
  if (instance.data.i === 0) {
      fileInput.addEventListener('drop', async function(event) {
    event.preventDefault();
    console.log("File(s) dropped.");
    instance.publishState("a_file_or_folder_is_hovering", false);

    stageDroppedFiles(getAllFileEntries(event.dataTransfer.items)).then((data) => {
        console.log("Dropped files staged. Checking conditions.");
        if (checkConditions(buildConditions(data.files))) {
            console.log("Conditions met. Sending data.");
            sendData(data.numerator, data.denominator, data.files, data.extensions, data.names);
        } else {
            console.log("Conditions not met. File(s) invalid.");
        }
    });
});
  }

  /*

   WHEN A FILE IS UPLOADED USING THE SYSTEM FILE MANAGER 

  */

  fileInput.onchange = () => {
    console.log("File(s) selected via file manager.");
    if (checkConditions(buildConditions([...fileInput.files]))) {
        console.log("Conditions met. Staging files.");
        instance.data.stageFiles([...fileInput.files]);
    } else {
        console.log("Conditions not met. File(s) invalid.");
    }
};
  //We've executed the one-time code. Update the iteration variable
  instance.data.i++;

  if(document.getElementById(`better-uploader-form${instance.data.time}`).parentElement.hasAttribute('id')){
      document.getElementById(`better-uploader-form${instance.data.time}`).parentElement.exports = {
          "stageFiles": instance.data.stageFiles
      }
  }
}




// function send_file(s)_to_cloud

function(instance, properties, context) {

    /*
    
    OBJECT DOCUMENTATION FOR INSTANCE.DATA
    USED IN BOTH ELEMENT ACTIONS AND UPDATE FUNCTION
    
    encodedfiles: Array []
	getBase64: async function getBase64(file)
	i: number
	method: "click" or "drop"
	placeholder: "text"
	selectedFiles: Array []
	stageFiles: function stageFiles(input)
	time: unix timestamp
	updateLoadingBar: function updateLoadingBar(top, bot)
    
    */
    
    //Make sure errors gets reset to 0
    console.log("Starting upload process");
    instance.publishState("upload_errors", 0);
    let arr = []
      , dataArray = []
      , renamedArr = []
      , i = 0
      , numerator = 0;
    function sendFilesToExposedState(url) {
        let denominator = instance.data.encodedfiles.length;
        if (url) {
            numerator++;
            let progress = (numerator / denominator * 100).toFixed(2);
            instance.publishState("uploading_progress", progress);
            let https = `https:${url}`;
            arr.push(https),
            instance.publishState("uploaded_data", arr),
            instance.triggerEvent("file_is_uploaded")
        }
        Object.keys(arr).length == Object.keys(instance.data.encodedfiles).length && (console.log("Uploading is complete"),
        instance.publishState("file_name", renamedArr.toString()),
        instance.triggerEvent("file(s)_are_done_uploading"))
    }
    async function upload(files) {
        console.log("Starting upload function");
        let renamedFiles = []
          , errors = 0;
        async function sendToServer(index) {
            return new Promise(((resolve,reject)=>{
                instance.uploadFile(renamedFiles[index], (function(err, url) {
                    err && (console.log(`Error: ${err}`),
                    resolve("error")),
                    url && resolve(url)
                }
                ), void 0, (function(num) {
                    setTimeout((()=>{
                        instance.publishState("uploading_progress_single", 100 * num)
                    }
                    ), 25)
                }
                ))
            }
            ))
        }
        files.forEach(((item,index)=>{
            let newFile = new File([files[index].data],files[index].name);
            renamedFiles.push(newFile)
        }
        ));
        let i = 0
          , j = Object.keys(dataArray).length;
        for (i = 0; i < j; i++) {
            instance.publishState("uploading_progress_single", 0);
            let url = await sendToServer(i);
            "error" === url ? errors++ : sendFilesToExposedState(url)
        }
        instance.publishState("upload_errors", errors)
    }

    async function main() {
        console.log("Starting main function");
        console.log(`Processing ${instance.data.selectedFiles.length} selected files`);
        
        for (let index = 0; index < instance.data.selectedFiles.length; index++) {
            let item = instance.data.selectedFiles[index];
            console.log(`Processing file ${index + 1}: ${item.name}`);
            let dataObj = { name: null, data: null };
            
            if (isVideo(item)) {
                console.log(`Extracting audio from video: ${item.name}`);
                instance.publishState("uploading_progress_single", -1);
                try {
                    item = await extractAudioFromVideo(item);
                    console.log(`Audio extracted successfully from: ${item.name}`);
                } catch (error) {
                    console.error('Error extracting audio:', error);
                    continue; // Skip this file if audio extraction fails
                } finally {
                    instance.publishState("uploading_progress_single", 0);
                }
            }
            
            if (properties.new_uploaded_name == null) {
                console.log(`Using original name for ${item.name}`);
                dataObj.name = item.name;
                dataObj.data = item;
            } else {
                console.log(`Renaming ${item.name}`);
                let ext = item.name.split('.').pop();
                let newName = i === 0 ? `${properties.new_uploaded_name}.${ext}` : `${properties.new_uploaded_name}(${i}).${ext}`;
                renamedArr.push(newName);
                dataObj.name = newName;
                dataObj.data = item;
                i++;
                console.log(`File renamed to: ${newName}`);
            }
            
            dataArray.push(dataObj);
        }
        
        console.log(`Processed ${dataArray.length} files`);
        console.log(`Encoded files count: ${instance.data.encodedfiles.length}`);
        
        if (dataArray.length === instance.data.encodedfiles.length) {
            console.log("All files processed, starting upload");
            upload(dataArray);
        } else {
            console.error("Mismatch in file counts, upload not started");
            console.log(`DataArray length: ${dataArray.length}`);
            console.log(`Encoded files length: ${instance.data.encodedfiles.length}`);
        }
    }
    
    async function rename(method, dataObj, item, index) {
        console.log(`Renaming file: ${item.name}`);
        let file = item;
        let ext = 'wav';
        
        if (isVideo(item)) {
            console.log(`Extracting audio from video: ${item.name}`);
            instance.publishState("uploading_progress_single", -1);
            try {
                file = await extractAudioFromVideo(item);
                console.log(`Audio extracted successfully from: ${item.name}`);
            } catch (error) {
                console.error('Error extracting audio:', error);
                return;
            } finally {
                instance.publishState("uploading_progress_single", 0);
            }
        } else {
            ext = item.name.split('.').pop();
        }
    
        let newName = i === 0 ? `${properties.new_uploaded_name}.${ext}` : `${properties.new_uploaded_name}(${i}).${ext}`;
        renamedArr.push(newName);
        dataObj.name = newName;
        dataObj.data = file;
        dataArray.push(dataObj);
        i++;
        console.log(`File renamed to: ${newName}`);
    }

    function isVideo(file) {
        const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpg', '.mpeg', '.3gp', '.vob'];
        return videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }

    // Include lamejs in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js"></script>

console.log("Lame.js loaded:", typeof lamejs !== 'undefined');

async function extractAudioFromVideo(file) {
    console.log(`Extracting audio from: ${file.name}`);
    console.log("Lame.js available:", typeof lamejs !== 'undefined');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async function(e) {
            try {
                const arrayBuffer = e.target.result;
                console.log("File loaded, size:", arrayBuffer.byteLength);
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                console.log("Audio decoded, duration:", audioBuffer.duration);
                const mp3 = audioBufferToMp3(audioBuffer);
                console.log("MP3 encoded, chunks:", mp3.length);
                const audioBlob = new Blob(mp3, { type: 'audio/mp3' });
                console.log("Blob created, size:", audioBlob.size);
                resolve(new File([audioBlob], file.name.replace(/\.[^/.]+$/, ".mp3"), { type: 'audio/mp3' }));
            } catch (error) {
                console.error("Error in audio processing:", error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function audioBufferToMp3(buffer) {
    const sampleRate = buffer.sampleRate;
    const samples = buffer.getChannelData(0);
    console.log("Sample rate:", sampleRate, "Samples:", samples.length);
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 320);
    const mp3Data = [];

    const sampleBlockSize = 1152;
    const numSamples = Math.floor(samples.length / sampleBlockSize);

    for (let i = 0; i < numSamples; i++) {
        const sampleChunk = samples.subarray(i * sampleBlockSize, (i + 1) * sampleBlockSize);
        const int16SampleChunk = new Int16Array(sampleBlockSize);
        for (let j = 0; j < sampleBlockSize; j++) {
            int16SampleChunk[j] = Math.max(-32768, Math.min(32767, Math.round(sampleChunk[j] * 32768)));
        }
        const mp3buf = mp3encoder.encodeBuffer(int16SampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
    }

    console.log("MP3 encoding complete, chunks:", mp3Data.length);
    return mp3Data;
}
    
    switch (instance.data.encodedfiles) {
        case undefined:
        case "undefined":
        case null:
            console.log("Uploader is empty");
            window.alert("The Uploader is empty, please select or drag & drop some files before uploading.");
            break;
        default:
            if (instance.data.encodedfiles.length > 0) {
                console.log(`Processing ${instance.data.encodedfiles.length} files`);
                main().catch(error => console.error('Error in main:', error));
            } else {
                console.log("Uploader is empty");
                window.alert("The Uploader is empty, please select or drag & drop some files before uploading.");
            }
    }
}
