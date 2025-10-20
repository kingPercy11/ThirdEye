svc = LinearSVC()
svc.fit(x_train,y_train)
y_pred = svc.predict(x_test)
print(classification_report(y_pred,y_test,zero_division=True))