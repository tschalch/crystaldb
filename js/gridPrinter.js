/**
 * class for dynamically setting up tables using taffydb
 * based on an example by Ian Smith on taffydb.com
 *
**/

var getCheckbox = function(str, fn, rowid){
    var checked = (str == "on") ? true : false;
    var cbox = document.createElement("input");
    cbox.type = "checkbox";
    cbox.checked = checked;
    cbox.disabled = false;
    cbox.rowid = rowid;
    $(cbox).change(function(){
        fn(this.rowid);
        })
    return cbox;
}

var gridPrinter = function (config, taffyCollection) {
        var app = {
                sortColumn:function (col) {
                                var lastSort = this.sort;
                                this.sort = {};
                                if (((this.sort != {}) ? lastSort[col] == "logical" : false)) {
                                        this.sort[col] = "logicaldesc";
                                } else {
                                        this.sort[col] = "logical";
                                }
                                this.print();
                        },
                                        
                rowsPerPage: 15,
                currentPage: 1,
                pager: function(pagerID){
                    var rowsPerPage = (this.rowsPerPage == "*") ? this.get().length : this.rowsPerPage;
                    this.totalPages = Math.ceil(this.get().length/rowsPerPage);
                    var gP = this;
                    var input = document.createElement("input");
                    $(input).val(this.currentPage + "/" + this.totalPages)
                            .change(function(){
                                var page = parseInt($(this).val());
                                gP.rowsPerPage = (page > 0 && page <= gP.totalPages) ?
                                                            page : gP.currentPage;
                                gP.print()
                            })
                            .addClass('pager')
                    var rppSelect = document.createElement("select");
                    $(rppSelect).append($("<option value='15'>15</option>"))
                               .append($("<option value='25'>25</option>"))
                               .append($("<option value='50'>50</option>"))
                               .append($("<option value='*'>all</option>"))
                    $(rppSelect).val(this.rowsPerPage)
                            .change(function(){
                                gP.rowsPerPage = ($(this).val() == "*") ? "*" : parseInt($(this).val());
                                gP.currentPage = 1;
                                var rowsPerPage = (gP.rowsPerPage == "*") ? gP.get().length : gP.rowsPerPage;
                                gP.totalPages = Math.ceil(gP.get().length/rowsPerPage);
                                $(input).val(gP.currentPage + "/" + gP.totalPages)
                                gP.print();
                            })
                            .addClass('pager')
                    var navButtons = {"first": function(){return 1;},
                                      "prev": function(){return (gP.currentPage > 1) ? gP.currentPage - 1 : gP.currentPage;},
                                      "input" : 0,
                                      "rppSelect" : 0,
                                      "next": function(){return (gP.currentPage < gP.totalPages) ? gP.currentPage + 1 : gP.currentPage;},
                                      "end": function(){ return gP.totalPages}
                                      };
                    $("#" + pagerID).empty();
                    jQuery.each(navButtons, function(s, v){
                        if (s == "input"){
                            $("#" + pagerID).append(input);
                        } else if (s == "rppSelect"){
                            $("#" + pagerID).append(rppSelect);
                        } else {
                            var button = document.createElement("a");
                            var icon = document.createElement("span");
                            $(icon).addClass("ui-icon ui-icon-seek-" + s);
                            $(button).addClass("pagerButton fg-button ui-state-default fg-button-icon-solo ui-corner-all")
                                    .attr('id', s)
                                    .attr('title', s)
                                    .append(icon)
                                    .click( function(){
                                        gP.currentPage = v();
                                        gP.print();
                                        $(input).val(gP.currentPage + "/" + gP.totalPages);
                                    })
                                    .append(s)
                            $("#" + pagerID).append(button);
                        }
                    });
                },
                print: function(){
                        this.sort = (typeof(this.sort) == "undefined") ?
                            (typeof(config.sort) == "undefined") ?  {} : config.sort : this.sort;
                        this.orderBy(this.sort);
                        var thehead = document.createElement("thead");
                        config.columns = config.columns || TAFFY.getObjectKeys(this.first());
                        var newRow = document.createElement("tr");
                        for (var x = 0; x < config.columns.length; x++) {
                                var newCell = document.createElement("th");
                                $(newCell).addClass("grid ui-state-default").css("cursor", "pointer")
                                newCell.appendChild(document.createTextNode(
                                        TAFFY.isObject(config.columns[x]) ? 
                                        config.columns[x]["display"] : 
                                        config.columns[x]
                                ));
                                if (TAFFY.isObject(config.columns[x]) && 
                                        !TAFFY.isUndefined(config.columns[x].sortable) && 
                                        config.columns[x].sortable) {
                                                newCell.colName = config.columns[x]["name"];
                                                if(this.sort[newCell.colName] == "logical"){
                                                    var icon = document.createElement("span");
                                                    $(icon).addClass("ui-icon ui-icon-triangle-1-s").css("float:", "right");
                                                    newCell.appendChild(icon);
                                                }
                                                if(this.sort[newCell.colName] == "logicaldesc"){
                                                    var icon = document.createElement("span");
                                                    $(icon).addClass("ui-icon ui-icon-triangle-1-n").css("float:", "right");
                                                    newCell.appendChild(icon);
                                                }
                                                newCell.onclick = function () {
                                                        app.sortColumn(this.colName);
                                        }
                        }
                                newRow.appendChild(newCell);
                        }
                        thehead.appendChild(newRow);
                        var thebody = document.createElement("tbody");
                        var rowsPerPage = (this.rowsPerPage == "*") ? this.get().length : this.rowsPerPage;
                        for (var c = (this.currentPage - 1) * rowsPerPage; c < this.currentPage * rowsPerPage; c++){
                                r = this.first([c]);
                                if (TAFFY.isUndefined(r)) continue;                                
                                var newRow = document.createElement("tr");
                                for (var x = 0; x < config.columns.length; x++) {
                                        var newCell = document.createElement("td");
                                        $(newCell).addClass("grid");
                                        newCell.appendChild(
                                                (TAFFY.isObject(config.columns[x]) && 
                                                !TAFFY.isUndefined(config.columns[x].name)) ? 
                                                    (config.columns[x].type == "checkbox") ?
                                                        getCheckbox(r[config.columns[x].name], config.toggleExpired, r[config.id]) :
                                                        document.createTextNode(r[config.columns[x].name]) : 
                                                            // #NEW# add condition for custom columns with callme methods
                                                            (TAFFY.isObject(config.columns[x]) && 
                                                            !TAFFY.isUndefined(config.columns[x].callme)) ?
                                                                config.columns[x].callme(r,c) :
                                                            // #NEW# otherwise add column as normal
                                                            TAFFY.isString(config.columns[x]) ? 
                                                            document.createTextNode(r[config.columns[x]]) : 
                                                            document.createTextNode("")
                                        );
                                        newRow.appendChild(newCell);
                                }
                                if (config.id != "undefined"){
                                    newRow.rowid = r[config.id];
                                    newRow.parent = thebody;
                                    $(newRow).dblclick( function(){
                                        config.dblClickRow(this.rowid);
                                    });
                                    $(newRow).click( function(){
                                        $('tr').each(function(i){
                                            $(this).removeClass("ui-state-highlight");
                                        });
                                        $(this).toggleClass("ui-state-highlight");
                                        lastSel = this.rowid;
                                    });
                                }
                                thebody.appendChild(newRow);
                        };
                        var thetable = document.createElement("table");
                        $(thetable).addClass("grid");
                        thetable.appendChild(thehead);
                        thetable.appendChild(thebody);
                        thetable.border=1;
                        document.getElementById(config.containerID).innerHTML = "";
                        document.getElementById(config.containerID).appendChild(thetable);
                }
        }
        app = TAFFY.mergeObj(app,taffyCollection);
        return app;
}
