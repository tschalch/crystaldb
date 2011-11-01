<?php
//Rest server based on LornaJane's example on http://www.lornajane.net/posts/2008/PHP-Rest-Server-part-1-of-3
include_once("php/functions.php");
//require_once('../FirePHPCore/FirePHP.class.php');
//$firephp = FirePHP::getInstance(true); 
//require_once('../FirePHPCore/fb.php');
//$firephp->setEnabled(false);  // or FB::

class labdb {
    public function getRecords($crystal_id) {
        //FB::send($crystal_id, 'crystal_id');
        if ($crystal_id == ""){
            $q = "SELECT id,data FROM crystals";
        } else {
            $q = "SELECT id,data FROM crystals WHERE id='$crystal_id'";
        }
        //FB::send($q, 'query');
        $records = pdo_query($q);
        //FB::send(print_r($records), 'getRecords return');
        return $records;
    }
    
    public function putRecord($crystal_id, $data) {
        $q = "UPDATE crystals SET `data` = '$data' WHERE id='$crystal_id'";
        $records = pdo_query($q);
    }

    public function postRecord($crystal_id, $data) {
        $q = "INSERT INTO crystals (id, data) VALUES ('$crystal_id', '$data')";
        $records = pdo_query($q);
    }

    public function deleteRecord($crystal_id) {
        $q = "DELETE FROM crystals WHERE id='$crystal_id'";
        $records = pdo_query($q);
    }

}


class Rest_Service {
    public function setLabdb($labdb){
        $this->labdb = $labdb;
    }

    public function setResponse($response){
        $this->response = $response;
    }
    
    public function handle() {
        $urlParts = parse_url($this->url);
        // substring from 1 to avoid leading slash
        $this->_pathParts = split('/', substr($urlParts['path'], 1));

        // glue the first part of the path to the upper case request method to make a unique function name, e.g. usersGET
        $method = $this->_pathParts[sizeof($this->_pathParts)-2] . strtoupper($this->method);
        $this->recordID = $this->_pathParts[sizeof($this->_pathParts)-1];

        try {
            // now call the method in this class that wraps the one we actually want
            $this->$method();
            if($this->method == "GET") $this->response->output();
            return true;
        } catch (Service_Exception_Abstract $e) {
            $this->response->errorOutput($e);
        } catch (Exception $e) {
            die('An Unexpected Error Has Occurred');
        }
        return false;
    }
    
    protected function crystalsGET() {
        //FB::send($this->recordID, 'recordID');
        $this->response->crystals = $this->labdb->getRecords($this->recordID);
        return true;
    }
    protected function crystalsPUT() {
        $this->response->crystals = $this->labdb->putRecord($this->recordID, $this->putArgs['data']);
        return true;
    }
    protected function crystalsPOST() {
        //FB::send(implode(",", $this->postArgs), 'postArgs');
        $this->response->crystals = $this->labdb->postRecord($this->recordID, $this->postArgs['data']);
        return true;
    }
    protected function crystalsDELETE() {
        $this->response->crystals = $this->labdb->deleteRecord($this->recordID);
        return true;
    }
}


class Response {

    public function output() {
        header('Content-type: text/json');
        $c1 = 1;
        echo "[";
        foreach($this->crystals as $crystal){
            foreach($crystal as $prop_key => $prop_value) {
                if ($prop_key=='data') echo "$prop_value";
            }
            if ($c1 < sizeof($this->crystals)) echo ", ";
            $c1++;
        }
        echo "]";
    }
}

//include accesscontrol

$service = new Rest_Service();
// instantiate the main functional class and pass to service
$labdb = new labdb();
$service->setLabdb($labdb);
// create a response object and pass to service
$response = new Response();
$service->setResponse($response);

// set up some useful variables
$service->url = $_SERVER['REQUEST_URI'];
$service->method = $_SERVER['REQUEST_METHOD'];
$service->getArgs = $_GET;
$service->postArgs = $_POST;
$service->putArgs = $_PUT;
parse_str(file_get_contents('php://input'), $service->putArgs);
parse_str(file_get_contents('php://input'), $service->deleteArgs);
$service->handle();


// decide what to do

// retrieve from / commit to database

// return data / instructions

?>
