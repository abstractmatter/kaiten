window.kConnectors.languages = {
	db: {},
	language: 'en',
	setCurrentLanguage: function(language){
		if (this.exists(language))
		{
			this.language = language;
			this.translate();
		}
	},
	getCurrentLanguage: function(){
		return this.language;
	},
	userLanguage: function (){
		var language = navigator.language || navigator.userLanguage || '';
		language = language.toLowerCase().split('-')[0];
		if (this.exists(language))
		{
			this.language = language;
		}
		return language;
	},
	add: function (langID, translations){
		this.db[langID] = translations;
	},
	translate: function (){
		var key, 
			db;
		if (!this.exists(this.language))
		{
			return;
		}
		db = this.db[this.language];
		for (key in db)
		{
			if ($.type(db[key])=='string')
			{
				$('#translate-'+key).html(db[key]);
			}
			else
			{
				for (sel in db[key])
				{
					if (sel != 'h1' && sel != 'h2' && sel != 'h3' && sel != 'p' && sel != 'div')
					{
						$('#translate-'+key+' .'+sel).html(db[key][sel]);
					}
					else
					{
						$('#translate-'+key+' '+sel).html(db[key][sel]);
					}
				}
			}
		}
	},
	get: function (key){
		if (!this.db[this.language].hasOwnProperty(key))
		{
			return key;
		}			
		return this.db[this.language][key];
	},
	exists: function (langID){
		if ($.type(langID)!='string')
		{
			return false;
		}
		return this.db.hasOwnProperty(langID);
	}
};