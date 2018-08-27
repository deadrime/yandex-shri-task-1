import { loadList, loadDetails } from './api';
import { getDetailsContentLayout } from './details';
import { createFilterControl } from './filter';

export function initMap(ymaps, containerId) {
  const myMap = new ymaps.Map(containerId, {
    center: [55.76, 37.64],
    controls: [],
    zoom: 10
  });

  const objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 64,
    clusterIconLayout: 'default#pieChart',
    clusterDisableClickZoom: false,
    geoObjectOpenBalloonOnClick: false,
    geoObjectHideIconOnBalloonOpen: false,
    geoObjectBalloonContentLayout: getDetailsContentLayout(ymaps)
  });

  loadList().then(data => {
    objectManager.add(data);
    myMap.geoObjects.add(objectManager);
  });

  // cluster color
  objectManager.clusters.events.add('add', e => {
    let cluster = objectManager.clusters.getById(e.get('objectId'))
    let objects = cluster.properties.geoObjects;
    const defective = objects.filter(obj => !obj.isActive)
    let color = defective.length > 0 ? defective.length === objects.length ? 'red' : 'yellow' : 'green'
    objectManager.clusters.setClusterOptions(cluster.id, {
      preset: `islands#${color}ClusterIcons`
    });
  });

  // details
  objectManager.objects.events.add('click', event => {
    const objectId = event.get('objectId');
    const obj = objectManager.objects.getById(objectId);

    if (!obj.properties.details) {
      loadDetails(objectId).then(data => {
        console.log(data)
        obj.properties.details = data
        objectManager.objects.balloon.open(objectId);
      });
    } else {
      objectManager.objects.balloon.open(objectId);
    }
  });

  // filters
  const listBoxControl = createFilterControl(ymaps);
  myMap.controls.add(listBoxControl);

  var filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters => {
    objectManager.setFilter(
      obj => filters[obj.isActive ? 'active' : 'defective']
    );
  });
}
