<?php

error_reporting(0);

if (!isset($_GET['url'])){
	exit;
}

$url = $_GET['url'];

$html = file_get_contents($url);

$dom = new DomDocument();
$dom->loadHTML($html);

$xpath = new DomXpath($dom);

$urlInfo = parse_url($url);

echo json_encode(array(
	'title'   => $xpath->evaluate('string(/html/head/title)')
));