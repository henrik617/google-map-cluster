$(document).ready(function () {
    var map;
    var new_domain_show = false, bad_domain_show = false;
    var black_domain_list = ["json/blacklist/blacklist-small.json","json/blacklist/blacklist-medium.json","json/blacklist/blacklist-large.json"];
    var new_domain_list = ["json/newdomainlist/newdomainlist-small.json","json/newdomainlist/newdomainlist-medium.json","json/newdomainlist/newdomainlist-large.json"];
    var domain_show_position = [1,1];       // first: for new domain, second: for black domain; values: 0~2, 0:small, 1: medium, 2: large
    var domain_data = [];   // 0: new domain, 1: black
    var markers = [];   // 0: new domain, 1: black
    var info_window = null;
    var which_button = -1; // -1: at first, 0: new domain, 1: black
    var maker_color = ["#00FF00", "#FF0000"];
    var markerCluster = []; // 0: new domain, 1: black
    var file_prefix = ["green","red"];
    var domain_names = ["newdomain","black"];
    initMap();
    // init();
    function initMap()
    {
        var centerlocation;
        centerlocation = new google.maps.LatLng(47.89545, -122.29541666667);
        map = new google.maps.Map(document.getElementById('map-canvas'), {
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              center: centerlocation, 
              zoom: 3
        });
        domain_data[0] = null;
        domain_data[1] = null;
        markers[0] = [];
        markers[1] = [];
        markerCluster[0] = null;
        markerCluster[1] = null;
        info_window = new google.maps.InfoWindow({maxWidth: 500, maxHeight: 300});

    }
    function showNoneLocationDomains()
    {
        if (which_button != -1)
        {
            var none_loc_data_html = "";
            var length, i;
            length = domain_data[which_button].ResponseList.length;
            for (i=0; i<length; i++)
            {
                lat = domain_data[which_button].ResponseList[i].ip_loc.lat;
                lon = domain_data[which_button].ResponseList[i].ip_loc.lon;
                if (lat ==0 && lon == 0)
                {
                    var each = domain_data[which_button].ResponseList[i];
                    none_loc_data_html += "<tr>" +  "<td>" + each.domain + "</td>" + 
                                                    "<td>" + each.day + "</td>" + 
                                                    "<td>" + each.registrar + "</td>" + 
                                                    "<td>" + each.asn + "</td>"
                                        + "</tr>";
                }
            }
            if (none_loc_data_html != "")
            {
                $('.' + domain_names[which_button] + '_table .non_points tbody').html(none_loc_data_html);
                $('.' + domain_names[which_button] + '_table .table_container').css('display','block');
            }
        }
    }
    function showDomainCountsPerCountry()
    {
        if (which_button != -1)
        {
            var data_html = "";
            var length, i;
            var country;
            var domain_count = {};
            var keys = [], k;
            length = domain_data[which_button].ResponseList.length;
            for (i=0; i<length; i++)
            {   
                country = domain_data[which_button].ResponseList[i].ip_loc.country
                if (country != "")
                {
                    if (domain_count[country] == undefined)
                        domain_count[country] = 1;
                    else
                        domain_count[country] ++;    
                }
            }
            for (k in domain_count) {
                if (domain_count.hasOwnProperty(k)) {
                    keys.push(k);
                }
            }
            keys.sort();
            for (i=0;i<keys.length;i++)
            {
                k = keys[i];
                data_html += "<tr>" + "<td>" + k + "</td>" + "<td>" + domain_count[k] + "</td>" + "</tr>";
            }
            if (data_html != "")
            {
                $('.' + domain_names[which_button] + '_table .country_table tbody').html(data_html);
                $('.' + domain_names[which_button] + '_table .country_table_container').css('display','block');
            }
        }
    }
    function hideDomainCount()
    {
        $('.' + domain_names[which_button] + '_table .country_table tbody').html("");
        $('.' + domain_names[which_button] + '_table .country_table_container').css('display','none');
    }
    function hideNoneLocationDomains()
    {
        $('.' + domain_names[which_button] + '_table .non_points tbody').html("");
        $('.' + domain_names[which_button] + '_table .table_container').css('display','none');
    }
    function loadMap()
    {
        if (which_button != -1)
        {
            var length,i ,j, marker_count = 0;
            var lat, lon, marker;
            var content_string, found;
            length = domain_data[which_button].ResponseList.length;
            for (i=0; i<length; i++)
            {
                lat = domain_data[which_button].ResponseList[i].ip_loc.lat;
                lon = domain_data[which_button].ResponseList[i].ip_loc.lon;
                if (lat !=0 || lon != 0)
                {
                    found = false;
                    for (j=0;j<i-1;j++)
                    {
                        if (lat == domain_data[which_button].ResponseList[j].ip_loc.lat && 
                            lon == domain_data[which_button].ResponseList[j].ip_loc.lon)
                        {
                            found = true; break;                            
                        }
                    }
                    if (found == false)
                    {
                        marker = new google.maps.Marker({
                            map: map,
                            position: new google.maps.LatLng(lat,lon),
                            title: domain_data[which_button].ResponseList[i].domain,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                fillOpacity: 1,
                                fillColor: maker_color[which_button],
                                strokeOpacity: 1.0,
                                strokeColor: maker_color[which_button],
                                strokeWeight: 3.0, 
                                scale: 5
                            }
                        });
                        markers[which_button][marker_count] = marker;
                        google.maps.event.addListener(marker, 'click', (function(marker, i){
                            var length = domain_data[which_button].ResponseList.length;
                            var i, mlat, mlon, lat, lon;
                            var content_string = "<div class='info_container'>";
                            mlat = this.getPosition().lat();
                            mlon = this.getPosition().lng();
                            for (i=0;i<length;i++)
                            {
                                lat = domain_data[which_button].ResponseList[i].ip_loc.lat;
                                lon = domain_data[which_button].ResponseList[i].ip_loc.lon;
                                if (Math.abs(mlat - lat)<0.00001 && Math.abs(mlon - lon)< 0.00001)
                                {
                                    content_string += "<div class='info_window'><p>Domain: <a href='https://comox.hyas.com/View.php?type=domain&value=" + domain_data[which_button].ResponseList[i].domain + "'>" + domain_data[which_button].ResponseList[i].domain + "</a></p>" + 
                                        "<p>Registrar: " + domain_data[which_button].ResponseList[i].registrar + "</p>" + 
                                        "<p>Day: " + domain_data[which_button].ResponseList[i].day + "</p>" + "</div>";
                                }
                            }
                            content_string += "</div>";
                            info_window.setContent(content_string);
                            info_window.open(map, this);
                        }))
                        marker_count++;
                    }
                }
            }
            var options = {
                imagePath: 'images/' + file_prefix[which_button]
            };
            markerCluster[which_button] = new MarkerClusterer(map, markers[which_button], options);
            showNoneLocationDomains();
            showDomainCountsPerCountry();
        }
    }
    function clearMap(map)
    {
        for (var j=0;j<2;j++)
        {
            for (var i = 0; i < markers[j].length; i++) {
                markers[j][i].setMap(map);
            }
        }
        
    }
    function setMapOnAll(map) {
        if (which_button != -1)
        {
            for (var i = 0; i < markers[which_button].length; i++) {
                markers[which_button][i].setMap(map);
            }
            if (map != null)
            {
                var options = {
                    imagePath: 'images/' + file_prefix[which_button]
                };
                markerCluster[which_button] = new MarkerClusterer(map, markers[which_button], options);
            }
        }
    }
    function removeClusters()
    {
        // $('.cluster_circles').remove();
        if (which_button != -1 && markerCluster[which_button] != null)
            markerCluster[which_button].clearMarkers();
    }
    function domainShowAction()
    {
        if (which_button != -1)
        {
            if (domain_data[which_button] == null)
            {
                $.ajax({
                    dataType : 'json',
                    url: new_domain_list[domain_show_position[which_button]],
                    type: 'post',
                    success: function(data) {
                        domain_data[which_button] = data;
                        loadMap()
                    }
                });
            }
            else
            {
                setMapOnAll(map);
                showNoneLocationDomains();
                showDomainCountsPerCountry();
            }
        }
    }

    $('#new_domain_show').on('click', function(){
        // console.log("new domain button is clicked");
        which_button = 0;
        // if (bad_domain_show == true)
        // {
        //     clearMap(null);
        //     removeClusters();
        //     bad_domain_show = false;
        // }        
        if (new_domain_show == false)
        {
            new_domain_show = true;
            domainShowAction();
        }
        else
        {
            new_domain_show = false;
            hideNoneLocationDomains();
            hideDomainCount();
            setMapOnAll(null);
            removeClusters();
        }
    })
    $('#bad_domain_show').on('click', function(){
        // console.log("new domain button is clicked");
        which_button = 1;
        // if (new_domain_show == true){
        //     clearMap(null);
        //     removeClusters();
        //     new_domain_show = false;
        // }
        if (bad_domain_show == false)
        {
            bad_domain_show = true;
            domainShowAction();
        }
        else
        {
            bad_domain_show = false;
            hideDomainCount();
            hideNoneLocationDomains();
            setMapOnAll(null);
            removeClusters();
        }
    })
});