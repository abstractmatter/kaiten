/* CONNECTORS COLLECTION */

window.kConnectors.mycollection = {
	// the collection name
	collectionName : "collectionname",
	
	// (optional) the relative path to the CSS file used by this collection (relative to the document)
	cssFile		: 'collection.css',
	
	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	// by inspecting the link, this function decides if Kaiten has to check the connectors in this collection
	connectable	: function(href, $link){
		return true;
	},
	
	// (optional) initialization function executed only once, the first time the connectors collection is used
	init		: function($kaiten){
	},
	
	// (optional) destroy function executed only once, when the connectors collection is unregistered
	destroy		: function($kaiten){
	},
	
	// the connectors array
	connectors	: [ 
	          	   	// the 1st connector in the collection
	          	    {
	          	    	// the connector name
	          	    	name : "connectorname",
	          	    	
	          	    	// (optional) the relative path to the CSS file used by this connector (relative to the document)
	          	    	cssFile : 'connector.css',
	          	    	
	          	    	// (optional, defaults to "false") the test function operating on the link being clicked by the user.
	          	    	// by inspecting the link, this function decides if Kaiten can use this connector to load the panel content
	    				connectable : function(href, $link) {
	    					return true;
	    				},
	    				
	          	    	// (optional) when the connectable function returns true, this function determines the data that has to be be passed to the loader function.
	    				// usually, it does its work using the href attribute of the link and/or the link element itself
	    				getData : function(href, $link) {
	    					return { };
	    				},
	    				
	    				// the function that will load and return the panel content
	    				loader : function(data, $panel, $kaiten) {
	    					return '';
	    				},
	    				
	    				// (optional) initialization function executed only once, the first time the connector is used
	    				init		: function($kaiten){
	    				},
	    				
	    				// (optional) destroy function executed only once, when the connector is unregistered
	    				destroy		: function($kaiten){
	    				}
	          	    },
	          	    // add as many connectors as you want down below
	          	    {
	          	    	
	          	    }
	          	  ]
};