var global_symbols;

/**
 * Publisher
 *
 * This function is expected and executed by jsdoc-toolkit to generate
 * the output (documentation or anything else).
 */
function publish(symbols){
	var manual = [],
		 
		/**All widgetoption Symbol*/
		woptSymbols;	
		
	global_symbols = symbols;
				
	woptSymbols = symbols.toArray().filter( symbol_widgetoption );
	
	symbols.toArray().filter( symbol_widget ).forEach(function (widget){
		var folders = [], 
			opts,
			methods,
			events;
			
		function this_widget(wopt){ return widget_name(wopt)===widget.name; }
			
		//Processing options >>>
		opts = woptSymbols.filter( this_widget ).map( xsushee_media_manualdevtext );
		
		if (opts.length){
			folders.push( xsushee_media_manualfolder('Options', opts) );
		}		
		//<<<
		
		//Processing methods >>>
		methods = widget.getMethods().map( xsushee_media_manualdevtext );

		if (methods.length){
			folders.push( xsushee_media_manualfolder('Methods', methods) );
		}
		//<<<
		
		//Processing events >>>
		events = widget.getEvents().map( xsushee_media_manualdevtext );
		
		if (events.length){
			folders.push( xsushee_media_manualfolder('Events', events) );
		}
		//<<<
		
		//adding to manual
		if (folders.length){
			manual.push( xsushee_media_manualfolder(widget, folders) );
		}
	});
		
	print( xsushee_create_manual('API Reference (Prerelease)', manual) );
}

//-----------------------------------------------------------------------------
//---SOME HELPERS--------------------------------------------------------------
//-----------------------------------------------------------------------------

// Symbols and Tags explained
// ----------------------------------------------------------------------------
// /**
//  * This comment structure is a Symbol. 
//  *
//  * It starts with '/**' and ends with '*/'.
//  *
//  * A Symbol has descriptions (i.e. non tagged texts) and/or tags like
//  * these two below.
//  *
//  * @foo bar
//  * @bar baz
//  */

/**#@+
 * @param	{Symbol} s Symbol
 * @returns	{Boolean}
 */

/**True if symbol represents a widget*/
function symbol_widget(s){ return s.comment.tags.filter( tag_widget ).length; }

/**True if symbol represents a widget option*/
function symbol_widgetoption(s){ return !s.isEvent && s.comment.tags.filter( tag_widgetoption ).length; }

/**True if symbol represents a method*/
function symbol_method(s){ return s.is('FUNCTION'); }

/**#@-*/

/**#@+
 * @param		{DocTag} t Tag
 * @returns		{Boolean}
 */

/**True if tag is 'widget'*/
function tag_widget(t){ return t.title==='widget'; }

/**True if tag is 'widgetoption'*/
function tag_widgetoption(t){ return t.title==='widgetoption'; }

/**True if tag is 'param'*/
function tag_param(t){ return t.title==='param'; }

/**True if tag is 'signature'*/
function tag_signature(t){ return t.title==='signature'; }

/**True if tag is 'description'*/
function tag_desc(t){ return t.title==='desc'; }
/**#@-*/

/** 
 * @param		{Symbol} s Symbol
 * @returns		{String} Widget Name
 */
function widget_name(s){
	var n = symbol_widget(s) ? s.name : s.memberOf;
	return n.split('.').pop(); 
}

function get_desc_header(desc){
	if (!desc){
		return '';
	}
	return desc.split(/\n{2,}/)[0];
}

function get_desc_body(desc){
	if (!desc){
		return '';
	}
	function para(p){ return '<p>'+p+'</p>'; }
	return desc.split(/\n{2,}/).slice(1).map(para).join('');
}

//-----------------------------------------------------------------------------
//---XSUSHEE QUERY BUILDING----------------------------------------------------
//-----------------------------------------------------------------------------

function xsushee_create_manual(title, medias){
	return [
		'<QUERY>',
		'	<CREATE>',
		'		<MEDIA>',
		'			<INFO>',
		'				<MEDIATYPE>Manual</MEDIATYPE>',
		'			</INFO>',
		'			<DESCRIPTIONS>',
		'				<DESCRIPTION languageID="shared">',
		'					<TITLE>' + title + '</TITLE>',
		'				</DESCRIPTION>',
		'			</DESCRIPTIONS>',
		'			<DEPENDENCIES>',
		'				<DEPENDENCY type="mediaNavigation">',
							medias.join("\n"),
		'				</DEPENDENCY>',
		'			</DEPENDENCIES>',
		'		</MEDIA>',
		'	</CREATE>',
		'</QUERY>'
	].join("\n");
}

function xsushee_media_manualfolder(folder, medias){
	var title,
		header = '',
		body   = '';
	
	if (folder instanceof JSDOC.Symbol){
		title  = folder.name;
		header = get_desc_header(folder.desc);		
		body   = get_desc_body(folder.desc);
		if (body){
			body = '<CSS>'+body+'</CSS>';
		}
	} else {
		title = folder;
	}
	
	return [
		'<MEDIA>',
		'	<INFO>',
		'		<MEDIATYPE>ManualFolder</MEDIATYPE>',
		'	</INFO>',
		'	<DESCRIPTIONS>',
		'		<DESCRIPTION languageID="shared">',
		'			<TITLE>' + title + '</TITLE>',
		'			<HEADER>' + header + '</HEADER>',
		'			<BODY>' + body + '</BODY>',
		'		</DESCRIPTION>',
		'	</DESCRIPTIONS>',
		'	<DEPENDENCIES>',
		'		<DEPENDENCY type="mediaNavigation">',
					medias.join("\n"),
		'		</DEPENDENCY>',
		'	</DEPENDENCIES>',
		'</MEDIA>'
	].join("\n");	
}

function xsushee_media_manualdevtext(symbol){
	return [
		'<MEDIA>',
		'	<INFO>',
		'		<MEDIATYPE>ManualDevText</MEDIATYPE>',
		'	</INFO>',
		'	<DESCRIPTIONS>',
		'		<DESCRIPTION languageID="shared">',
					xsushee_mediasummary(symbol),
					xsushee_mediatitle(symbol),
					xsushee_mediaheader(symbol),
					xsushee_mediabody(symbol),
					xsushee_mediacustom(symbol),
		'		</DESCRIPTION>',
		'	</DESCRIPTIONS>',
		'</MEDIA>'
	].join("\n");
}

//-----------------------------------------------------------------------------
//--MANUALDEVTEXT HELPERS------------------------------------------------------
//-----------------------------------------------------------------------------

/**Generates SUMMARY node (=usage)*/
function xsushee_mediasummary(symbol){
	var wname = widget_name(symbol),
		html  = [],
		sigs;
		
	if (!symbol.is('FUNCTION') || symbol.isEvent){
		return '';
	}
	
	sigs = function_signatures(symbol);
	
	//Generates the signature name according to the signature parameters
	function generate_signame(params){
		var tmp = []; 		
		tmp.push('<p class="sig-name">');
		tmp.push('.'+wname+"('"+symbol.name+"'");//ex: .kaiten('load'		
		if (params){
			params = params.map(function (param){
				if (param.optional){
					return '<span class="param-optional">['+param.name+']</span>';
				}
				return param.name;
			});			
			tmp.push(', '+params.join(', '));
		}		
		tmp.push(')</p>');
		return tmp.join('');
	}
	
	//Generates the signature description according to the signature parameters
	function generate_sigdesc(params){
		var tmp = [];
		if (!params){
			return '';
		}
		params.forEach(function (param){
			tmp.push('<p class="sig-desc">');
			tmp.push('	<span class="param-type">'+param.type+'</span>');
			tmp.push('	<span class="param-name">'+param.name+'</span>');
			tmp.push('	<span class="param-desc">'+param.desc+'</span>');
			tmp.push('</p>');
		});
		return tmp.join('');
	}
	
	if (!sigs.length){
		sigs.push(null);
	}
	
	html = sigs.map(function (sig){
		var signame = generate_signame(sig),
			sigdesc = generate_sigdesc(sig);
		return '<div class="sig">'+signame+sigdesc+'</div>';
	});
	
	return '<SUMMARY><CSS>'+html.join('')+'</CSS></SUMMARY>';
}

function xsushee_mediatitle(symbol){
	var n;
	if ( symbol.isEvent || symbol_widget(symbol) ){
		n = symbol.name;
	} else {
		n = symbol.name.split('.').pop();
	}
	return '<TITLE>' + n + '</TITLE>';
}

function xsushee_mediaheader(symbol){
	var firstDesc = symbol.comment.tags.filter( tag_desc )[0];
	if (!firstDesc){
		return '';
	}
	return '<HEADER>' + firstDesc.toString().split(/\n{2,}/)[0] + '</HEADER>';
}

/**Generates the content of MEDIA/DESCRIPTIONS/DESCRIPTION/BODY*/
function xsushee_mediabody(symbol){
	var html = [];
	
	symbol.comment.tags.filter( tag_desc ).forEach(function (tag){
		tag.desc.split(/\n{2,}/).forEach(function (para){
			html.push('<p class="doc-para">' + para.replace(/\n/g, ' ') + '</p>');
		});
	});
	
	return '<BODY><CSS>' + html.join('') + '</CSS></BODY>';
}

/**Generates CUSTOM node*/
function xsushee_mediacustom(symbol){
	
	//following mediacustom helpers will return something or not according to the symbol
	var xml = [
		xsushee_mediacustom_widget(symbol),
		xsushee_mediacustom_type(symbol),
		xsushee_mediacustom_name(symbol),
		xsushee_mediacustom_alias(symbol),
		xsushee_mediacustom_seealso(symbol)
	];
	
	return '<CUSTOM>' + xml.join('') + '</CUSTOM>';
}

//-- MEDIACUSTOM HELPERS ------------------------------------------------------

/**Generates CUSTOM/type node*/
function xsushee_mediacustom_type(symbol){
	var type;
	if ( symbol_widget(symbol) ){
		type = 'widget';
	} else if ( symbol_method(symbol) ){
		type = 'method';
	} else if ( symbol_widgetoption(symbol) ){
		type = 'option';
	} else if ( symbol.isEvent ){
		type = 'event';
	} else {
		throw new Error('cannot define type for ' + symbol.name );
	}
	return '<type>' + type + '</type>';
}

function xsushee_mediacustom_alias(symbol){
	return '<alias>' + symbol.alias + '</alias>';
}

/**Generates CUSTOM/name node*/
function xsushee_mediacustom_name(symbol){
	var n =
		symbol_widget(symbol) ? symbol.name :
			symbol_widgetoption(symbol) ? symbol.name.split('.').pop() :
				symbol.name;
	return '<name>' + n + '</name>';
}

/**Generates CUSTOM/widget node*/
function xsushee_mediacustom_widget(symbol){
	return '<widget>' + symbol.memberOf.split('.').pop() + '</widget>';
}

function function_signatures(symbol){
	var sigs = [], 
		i = -1;
	
	symbol.comment.tags.forEach(function (tag){
		if ( tag_signature(tag) ){
			i = sigs.push([])-1;
		} else if ( tag_param(tag) ){
			if (i<0){
				i = sigs.push([])-1;
			}
			sigs[i].push({ name:     tag.name,
						   type:     tag.type,
						   desc:     tag.desc,
						   optional: tag.isOptional });
		}
	});
	
	if (sigs.length){
		sigs = sigs.filter(function (sig){ return sig.length>0; });
	}
	
	return sigs;
}

function xsushee_mediacustom_seealso(symbol){
	var xml = [];
	
	symbol.see.forEach(function (alias){
		var symbol = global_symbols.getSymbol(alias);
		
		if (symbol){
			/*
			 XML Example
			 ----------------------------------------------
			 <see>
			 	<widget>kaiten</widget>
			 	<type>method</type>
				<name>load</name>
				<alias>jQuery.ui.kaiten#load</alias>
			 </see>
			 */
			xml.push([
				'<see>',
					xsushee_mediacustom_widget(symbol),
					xsushee_mediacustom_type(symbol),
					xsushee_mediacustom_name(symbol),
					xsushee_mediacustom_alias(symbol),
				'</see>'
			].join(''));
		}	
	});
	
	if (!xml.length){
		return '';
	}
	
	return '<seealso>' + xml.join('') + '</seealso>';
}