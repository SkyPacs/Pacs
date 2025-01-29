function OnStoredInstance(instanceId, tags, metadata)
    print('onStoredInstance function has been called')

    -- Full URL for the external server
    local url = "http://localhost:5000/api/process-dicom-from-orthanc"
    
    -- Construct the payload as a Lua table, then convert to JSON
    local payload = "{}"  -- Use an actual Lua table if needed, here it's empty JSON
    
    -- Optional headers (Content-Type set to application/json)
    local headers = {
        ["Content-Type"] = "application/json"
    }
    
    
    -- Send the POST request using HttpPost instead of RestApiPost for external service
    local response = HttpPost(url, payload, headers)  -- Use HttpPost for external calls
    
    -- Log the response for debugging
    print("Response from server: " .. tostring(response))
    
    -- Check for valid response
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



