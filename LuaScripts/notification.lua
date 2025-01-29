function OnStoredInstance(instanceId, tags, metadata)
    print('onStoredInstance function has been called')
    local url = "http://localhost:5000/api/process-dicom-from-orthanc"

    local payload = "{}"  
    local headers = {
        ["Content-Type"] = "application/json"
    }
    local response = HttpPost(url, payload, headers)  
    print("Response from server: " .. tostring(response))
    if response == nil then
        print("Error: No response received from the server.")
        return
    end

    if response["HttpStatus"] ~= 200 then
        print("Failed to notify server: " .. response["HttpStatus"])
    else
        print("Successfully notified server about new instance: " .. instanceId)
    end
end



