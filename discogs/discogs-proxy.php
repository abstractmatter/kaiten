<?php
	require_once('/var/www/kaiten/public_html/Kernel/common/nql.class.php');
	//require_once('/var/www/wikipedia/public_html/Kernel/common/nql.class.php');
	error_reporting(0);

    /* *** */
        
    $API_KEY = 'c80d98a505';
    
    /* *** */
    
    $shell = new Sushee_Shell();
    
    $SEARCH_TYPE = ($_POST['type']) ? $_POST['type'] : 'all';
    $SEARCH_QUERY = $_POST['q'];
	$SEARCH_PAGE = ($_POST['p']) ? $_POST['p'] : 1;
    
    $URL = (!empty($SEARCH_QUERY)) ? 
    	'http://www.discogs.com/search?type='.$SEARCH_TYPE.'&amp;q='.$SEARCH_QUERY.'&amp;page='.$SEARCH_PAGE.'&amp;f=xml' : 
    	'http://www.discogs.com/'.$_POST['uri'].'?f=xml';
        
    $shell->addCommand('
		<GET>
		   <WEBSERVICE url="'.$URL.'&amp;api_key='.$API_KEY.'"></WEBSERVICE>
		</GET>
    ');
    
    $shell->execute();
    
    $resp = $shell->getElement('/RESPONSE/RESULTS/WEBSERVICE/resp');
    $resp_xml = ($resp !== false) ? $resp->toString() : '<resp><error>No response received from Discogs!</error></resp>';    
    xml_out($resp_xml);
