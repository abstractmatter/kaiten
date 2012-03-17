<?php

	$URL = urldecode($_GET['url']);
	$EXTRACTOR = isset($_GET['extractor']) ? $_GET['extractor'] : 'ArticleExtractor';
	$OUTPUT = isset($_GET['output']) ? $_GET['output'] : 'html';

	// -- extractor --
	// ArticleExtractor|DefaultExtractor|LargestContentExtractor|KeepEverythingExtractor|CanolaExtractor

	// -- output --
	// html|htmlFragment|text|json|debug

	// use curl because xml from web api is corrupted!
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_URL, 'http://boilerpipe-web.appspot.com/extract?url='.$URL.'&extractor='.$EXTRACTOR.'&output='.$OUTPUT);
	curl_setopt($curl, CURLOPT_USERAGENT, 'Cloudglu (+http://www.cloudg.lu)');
	curl_setopt($curl, CURLOPT_REFERER, 'http://www.cloudg.lu');
	curl_setopt($curl, CURLOPT_ENCODING, 'gzip,deflate');
	curl_setopt($curl, CURLOPT_AUTOREFERER, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($curl, CURLOPT_TIMEOUT, 900);
	curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30);
	curl_setopt($curl, CURLOPT_FAILONERROR, false);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($curl, CURLOPT_HEADER, FALSE);
    curl_setopt($curl, CURLINFO_HEADER_OUT, true);
	$response = curl_exec($curl);
	curl_close($curl);

	// get content between <body> tags
	// preg_match('/<BODY\b[^>]*>(.*?)<\/BODY>/m', $response, $matches);
	// echo ($matches[1]);	

	// ugly farmer technique: regex don't work on complex documents?
	$response = substr($response,strpos($response,'<BODY'));
	$response = substr($response,strpos($response,'>')+1);
	$response = substr($response,0,strpos($response,'</BODY>'));


	$url_object = parse_url($URL);

	$parts = explode('/',$url_object['path']);
	array_pop($parts);
	
	$host = $url_object['scheme'] . '://' . $url_object['host'];
 	$folder = $host . implode('/',$parts) . '/';

	echo transform_xsl($response,$host,$folder);

	function transform_xsl($xml,$host,$folder){

		// Configuration du transformateur
		libxml_use_internal_errors(true);
		$xmldoc = new DOMDocument;
		$res = $xmldoc->loadXML('<markup>' . $xml . '</markup>');		
		if ($res === false)
			die('xml source error!<br />'.$xml);

		$xsl = new DOMDocument;
		$res = $xsl->load(dirname(__FILE__).'/boilerpipe.xsl');
		if ($res === false)
			die('xsl template error!<br />'.$xml);

		$proc = new XSLTProcessor;
		$proc->importStyleSheet($xsl);
		$proc->setParameter('', 'host', $host);
		$proc->setParameter('', 'folder', $folder);

		$output = $proc->transformToXML($xmldoc);
		if ($output === false)
			die('xsl transform error!<br />'.$xml);

		return $output;
	}
	
	// boilerpiper output invalid xml... sushee don't work here
	// require_once('/var/www/kaiten/public_html/Kernel/common.php');
	// $shell = new Sushee_Shell(false);
	// $shell->addCommand('
	// 	<GET>
	// 		<WEBSERVICE url="http://boilerpipe-web.appspot.com/extract" method="get">
	// 	 		<PARAM name="url">http://www.nectil.com/</PARAM>
	// 	 		<PARAM name="extractor">'.$EXTRACTOR.'</PARAM>
	// 	 		<PARAM name="output">html</PARAM>
	// 		</WEBSERVICE>
	// 	</GET>
	// ');
	// 
	// $shell->execute();
	// $response = $shell->getElement('/RESPONSE/RESULTS/WEBSERVICE');
	// xml_out($response);