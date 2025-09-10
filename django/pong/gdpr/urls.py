from django.urls import path

from . import views

urlpatterns = [
    path('new_export',              views.generate_export_key,  name='gpdr_new_export'),
    path('export/<str:token_id>',   views.export_data,          name='gdpr_export'),
    path('delete',                  views.delete_data,          name='gdpr_delete')
]
